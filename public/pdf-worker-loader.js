// PDF.js worker loader for better compatibility
// This file helps load the PDF.js worker in various environments

(function() {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    // Use the latest compatible version
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    console.log('PDF.js worker configured successfully');
  }
})();