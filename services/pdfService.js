import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFService {
  /**
   * CV'yi PDF'e dönüştürür ve linkleri tıklanabilir yapar.
   * @param {Object} user - Kullanıcı verileri (Dosya ismi için)
   * @param {string} elementId - Dönüştürülecek HTML elementinin ID'si
   */
  static async generateCVPDF(user, elementId = 'cv-preview') {
    try {
      console.log('📄 PDF oluşturuluyor (Link katmanı ile)...');

      const element = document.getElementById(elementId);
      if (!element) throw new Error('CV element bulunamadı!');

      // 1. ADIM: Elementi Klonla (Layout bozulmadan ölçüm yapmak için)
      // Orijinal element üzerinde işlem yapmak scroll kaymalarına neden olabilir.
      const clone = element.cloneNode(true);
      
      // Klonu görünmez bir kapta, sabit genişlikte render et
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '0';
      // Genellikle A4 genişliği için 794px veya elementin kendi genişliği kullanılır
      container.style.width = element.offsetWidth + 'px'; 
      container.appendChild(clone);
      document.body.appendChild(container);

      try {
        // 2. ADIM: html2canvas ile Görüntü Al
        const canvas = await html2canvas(clone, {
          scale: 2, // Yüksek kalite için retina scale
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');

        // 3. ADIM: PDF Ayarları
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();   // A4 Genişliği (~210mm)
        const pdfHeight = pdf.internal.pageSize.getHeight(); // A4 Yüksekliği (~297mm)

        // 4. ADIM: Ölçekleme Faktörünü Hesapla
        // Bu "Sihirli Sayı"dır. HTML pikselini PDF milimetresine çevirir.
        // Formül: PDF_Genişliği_MM / HTML_Element_Genişliği_PX
        const scaleFactor = pdfWidth / clone.offsetWidth;
        
        // Resmin PDF üzerindeki yüksekliği
        const imgHeight = canvas.height * scaleFactor / 2; // /2 çünkü canvas scale:2 yaptık

        // 5. ADIM: Resmi PDF'e Ekle (Sayfalama Mantığı ile)
        let heightLeft = imgHeight;
        let position = 0;
        let page = 1;

        // İlk sayfayı ekle
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // 6. ADIM: Linkleri Hesapla ve Ekle
        // Klonlanan element içindeki tüm linkleri bul
        const links = clone.querySelectorAll('a');
        const cloneRect = clone.getBoundingClientRect(); // Referans noktası

        links.forEach(link => {
          const linkRect = link.getBoundingClientRect();

          // Linkin klon elementi içindeki göreceli (relative) konumu
          const relativeX = linkRect.left - cloneRect.left;
          const relativeY = linkRect.top - cloneRect.top;

          // Koordinatları PDF birimine (mm) çevir
          const pdfX = relativeX * scaleFactor;
          const pdfY = relativeY * scaleFactor;
          const pdfW = linkRect.width * scaleFactor;
          const pdfH = linkRect.height * scaleFactor;

          // Hangi sayfada olduğunu hesapla
          // Örneğin link Y=350mm ise ve sayfa 297mm ise, link 2. sayfadadır.
          const linkPageNumber = Math.floor(pdfY / pdfHeight) + 1;
          
          // Linkin o sayfa içindeki Y konumu (Offset)
          const linkYOnPage = pdfY - ((linkPageNumber - 1) * pdfHeight);

          // Linki doğru sayfaya ekle
          pdf.setPage(linkPageNumber);
          
          // Link ekle (x, y, w, h, options)
          pdf.link(pdfX, linkYOnPage, pdfW, pdfH, { url: link.href });
          
          // DEBUG: Linklerin yerini görmek için (Geliştirme bitince silin)
          // pdf.rect(pdfX, linkYOnPage, pdfW, pdfH); 
        });

        // Eğer içerik tek sayfadan uzunsa, resmin geri kalanını ekle
        while (heightLeft > 0) {
          position = heightLeft - imgHeight; 
          pdf.addPage();
          page++;
          pdf.addImage(imgData, 'PNG', 0, -((page - 1) * pdfHeight), pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        // Dosyayı Kaydet
        const fileName = `${user.fullName || 'CV'}-${Date.now()}.pdf`;
        pdf.save(fileName);
        console.log(`✅ PDF başarıyla oluşturuldu. ${links.length} link eklendi.`);

      } finally {
        // Temizlik: DOM'u kirletmemek için klonu sil
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error('❌ PDF Hatası:', error);
      alert('PDF oluşturulamadı: ' + error.message);
    }
  }
}

export default PDFService;