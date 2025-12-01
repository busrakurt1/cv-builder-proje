import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFService {
  // CV'yi PDF'e dönüştür
  static async generateCVPDF(user, elementId = 'cv-preview') {
    try {
      console.log('📄 PDF oluşturuluyor...');

      // CV elementini bul
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('CV element bulunamadı!');
      }

      // Elementi canvas'a dönüştür
      const canvas = await html2canvas(element, {
        scale: 2, // Daha yüksek kalite
        useCORS: true,
        logging: false
      });

      // Canvas'tan resim verisi al
      const imgData = canvas.toDataURL('image/png');

      // PDF oluştur (A4 boyutu)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Resim boyutlarını hesapla
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      // Sayfaya sığdır
      if (imgHeight > pdfHeight) {
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      // Dosyayı kaydet
      const fileName = `${user.fullName || 'CV'}-${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      console.log('✅ PDF başarıyla oluşturuldu:', fileName);
      return true;
    } catch (error) {
      console.error('❌ PDF oluşturma hatası:', error);
      throw error;
    }
  }

  // Basit PDF oluşturma (alternatif)
  static async generateSimplePDF(user) {
    try {
      const pdf = new jsPDF();

      // Başlık
      pdf.setFontSize(20);
      pdf.text(user.fullName || 'CV', 20, 20);

      // Email
      pdf.setFontSize(12);
      pdf.text(`Email: ${user.email}`, 20, 35);

      // Telefon
      if (user.phone) {
        pdf.text(`Telefon: ${user.phone}`, 20, 45);
      }

      // Konum
      if (user.location) {
        pdf.text(`Konum: ${user.location}`, 20, 55);
      }

      // Özet
      if (user.summary) {
        pdf.text('Profesyonel Özet:', 20, 70);
        const splitSummary = pdf.splitTextToSize(user.summary, 170);
        pdf.text(splitSummary, 20, 80);
      }

      // Dosyayı kaydet
      const fileName = `${user.fullName || 'CV'}-simple.pdf`;
      pdf.save(fileName);

      return true;
    } catch (error) {
      console.error('❌ Basit PDF hatası:', error);
      throw error;
    }
  }
}

export default PDFService;

// Optimize edilmiş CV için PDF oluşturma fonksiyonu
export const handleExportOptimizedPDF = async (optimizedCV) => {
  if (!optimizedCV) return;

  try {
    console.log('📄 Optimize CV PDF oluşturuluyor...');
    await PDFService.generateCVPDF(optimizedCV.optimizedUser, 'optimized-cv-preview');
    console.log('✅ Optimize CV PDF başarıyla oluşturuldu!');
  } catch (error) {
    console.error('❌ Optimize PDF hatası:', error);
    alert('PDF oluşturulurken hata oluştu: ' + error.message);
  }
};
