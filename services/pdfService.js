import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFService {
  /**
   * CV'yi PDF'e dönüştürür ve linkleri tıklanabilir yapar.
   * - Fontların ve resimlerin yüklenmesini bekler (Boş/eksik çıktı sorununu çözer).
   * - A4 boyutuna göre ölçekler.
   * - Link koordinatlarını hesaplayıp PDF üzerine şeffaf katman olarak ekler.
   * * @param {Object} user - Kullanıcı verileri (Dosya ismi için)
   * @param {string} elementId - Dönüştürülecek HTML elementinin ID'si
   */
  static async generateCVPDF(user, elementId = 'cv-preview') {
    try {
      console.log('📄 PDF oluşturuluyor (Gelişmiş Link Desteği ile)...');

      const element = document.getElementById(elementId);
      if (!element) throw new Error('CV elementi bulunamadı!');

      // 1. ADIM: KLONLAMA VE TEMİZLİK
      // Orijinal DOM'u bozmamak için klon alıyoruz.
      const clone = element.cloneNode(true);
      
      // PDF'te görünmemesi gereken buton/alanları temizle
      clone.querySelectorAll('.pdf-exclude').forEach(el => el.remove());

      // 2. ADIM: GÖRÜNMEZ KONTEYNER (RENDER ALANI)
      // Kullanıcı fark etmeden arka planda işlem yapmak için ekran dışına bir alan açıyoruz.
      // A4 genişliği (~794px @ 96DPI) baz alınır veya elementin kendi genişliği kullanılır.
      const A4_WIDTH_PX = 794; 
      const container = document.createElement('div');
      
      container.style.position = 'fixed';
      container.style.left = '-10000px'; // Ekran dışı
      container.style.top = '0';
      container.style.width = Math.max(element.offsetWidth, A4_WIDTH_PX) + 'px'; 
      // ÖNEMLİ: visibility: hidden yaparsak html2canvas boş çıktı verebilir.
      container.style.visibility = 'visible'; 
      container.style.zIndex = '-9999';
      
      container.appendChild(clone);
      document.body.appendChild(container);

      try {
        // 3. ADIM: ASSET YÜKLEME BEKLEMELERİ (Kritik Bölüm)
        
        // A) Browser'ın repaint yapması için çok kısa bekle
        await new Promise(resolve => setTimeout(resolve, 100));

        // B) Fontların hazır olmasını bekle
        if (document.fonts && document.fonts.ready) {
             await document.fonts.ready;
        }

        // C) Tüm resimlerin tamamen yüklendiğinden emin ol
        const imgs = Array.from(clone.querySelectorAll('img'));
        if (imgs.length > 0) {
          await Promise.all(imgs.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve; // Hata olsa bile devam et, takılmasın
              setTimeout(resolve, 3000); // 3sn timeout güvenlik önlemi
            });
          }));
        }

        // 4. ADIM: HTML2CANVAS İLE GÖRÜNTÜ ALMA
        const canvas = await html2canvas(clone, {
          scale: 2, // Retina kalitesi (daha net yazı)
          useCORS: true, // Dış kaynaklı resimler için
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: container.scrollWidth,
          windowHeight: container.scrollHeight
        });

        // 5. ADIM: PDF OLUŞTURMA
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        // Canvas piksellerini PDF milimetresine çevirme oranı
        // Formül: (PDF Genişliği / Canvas Genişliği)
        const outputScale = pdfWidth / canvas.width;
        
        const imgHeightInPDF = canvas.height * outputScale;
        
        // -- Sayfalama Mantığı --
        let heightLeft = imgHeightInPDF;
        let position = 0;
        let pageIndex = 1;

        // İlk sayfayı bas
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPDF);
        heightLeft -= pdfHeight;

        // Taşma varsa yeni sayfalar ekle
        while (heightLeft > 0) {
          position -= pdfHeight; // Bir sayfa boyu yukarı kaydır
          pdf.addPage();
          pageIndex++;
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightInPDF);
          heightLeft -= pdfHeight;
        }

        // 6. ADIM: LİNKLERİ EKLEME (Merge Edilen Kısım)
        // Klon üzerindeki <a> etiketlerini bulup koordinatlarını PDF'e aktarıyoruz.
        const links = clone.querySelectorAll('a[href]');
        
        // Klonun referans başlangıç noktası
        const cloneRect = clone.getBoundingClientRect();

        links.forEach(link => {
          const linkRect = link.getBoundingClientRect();

          // Linkin klon içindeki pixel koordinatları (Sol üst köşeye göre)
          const relativeX_Px = linkRect.left - cloneRect.left;
          const relativeY_Px = linkRect.top - cloneRect.top;
          const w_Px = linkRect.width;
          const h_Px = linkRect.height;

          // Pixel -> mm Dönüşümü (html2canvas scale hesaba katılmalı)
          // Not: html2canvas scale:2 yaptık ama canvas.width da 2 kat büyüdü.
          // outputScale (pdfWidth / canvas.width) bu oranı zaten dengeler.
          // Ancak klon DOM üzerindeki ölçü 'scale 1' olduğu için, 
          // burada HTML element genişliğini baz alarak scaleFactor bulmak daha sağlıklıdır.
          
          const domScaleFactor = pdfWidth / clone.offsetWidth;

          const pdfX = relativeX_Px * domScaleFactor;
          const pdfY = relativeY_Px * domScaleFactor;
          const pdfW = w_Px * domScaleFactor;
          const pdfH = h_Px * domScaleFactor;

          // Linkin hangi sayfaya düştüğünü hesapla
          const linkPageNumber = Math.floor(pdfY / pdfHeight) + 1;
          
          // O sayfa içindeki Y konumu (Sayfa başından ofset)
          const linkYOnPage = pdfY - ((linkPageNumber - 1) * pdfHeight);

          // Eğer link PDF sayfa sınırları içindeyse ekle
          if (linkPageNumber <= pdf.getNumberOfPages()) {
            pdf.setPage(linkPageNumber);
            
            // Link ekle (x, y, w, h, options)
            pdf.link(pdfX, linkYOnPage, pdfW, pdfH, { url: link.href });
          }
        });

        // 7. ADIM: KAYDETME
        const safeName = user?.fullName?.replace(/\s+/g, '_') || 'CV';
        pdf.save(`${safeName}-${Date.now()}.pdf`);
        
        console.log(`✅ PDF başarıyla oluşturuldu (${links.length} link eklendi).`);

      } finally {
        // Temizlik: Oluşturulan geçici div'i sil
        document.body.removeChild(container);
      }

    } catch (error) {
      console.error('❌ PDF Oluşturma Hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
    }
  }
}

export default PDFService;