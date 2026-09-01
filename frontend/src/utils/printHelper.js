/**
 * Universal, isolated print helper for Prescriptions and Templates.
 * Prints directly via an isolated iframe to prevent blank pages caused by modal clipping or CSS cascades.
 */
export const printPrescriptionDirectly = (targetElementId = 'printable-rx') => {
  try {
    const rxElement = document.getElementById(targetElementId) ||
      document.querySelector('.prescription-paper') ||
      document.querySelector('.child-rx-paper') ||
      document.querySelector('.vijaya-rx-paper');

    if (!rxElement) {
      window.print();
      return;
    }

    // Create an invisible iframe for isolated printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();

    // Extract all stylesheets and head links from parent page
    let styleTags = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
      styleTags += node.outerHTML;
    });

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription Print</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 0 !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
              min-height: 100% !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-rx, .prescription-paper, .child-rx-paper, .vijaya-rx-paper {
              width: 100% !important;
              max-width: 100% !important;
              min-height: 100vh !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              display: block !important;
              position: relative !important;
              overflow: hidden !important;
            }
            .no-print {
              display: none !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${rxElement.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Wait for images & styles to load in iframe before triggering print dialog
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);
  } catch (e) {
    console.error('Direct print helper exception, falling back to window.print():', e);
    window.print();
  }
};
