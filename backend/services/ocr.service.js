import Tesseract from 'tesseract.js';
import { uploadFileToSupabase } from '../config/supabase.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
  }

  async ensureWorkerInitialized() {
    if (this.isInitialized && this.worker) {
      return true;
    }

    try {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {}
      });
      
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6',
      });
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      this.isInitialized = false;
      return false;
    }
  }

  async extractTextFromImage(imageFileOrBuffer) {
    try {
      const workerReady = await this.ensureWorkerInitialized();
      if (!workerReady) {
        throw new Error('OCR worker failed to initialize');
      }

      let imageBuffer;
      
      if (typeof imageFileOrBuffer === 'string') {
        return await this.worker.recognize(imageFileOrBuffer);
      } else if (imageFileOrBuffer.buffer) {
        imageBuffer = imageFileOrBuffer.buffer;
      } else if (Buffer.isBuffer(imageFileOrBuffer)) {
        imageBuffer = imageFileOrBuffer;
      } else {
        throw new Error('Unsupported file type for OCR processing');
      }

      const base64Image = imageBuffer.toString('base64');
      const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

      const { data: { text, confidence } } = await this.worker.recognize(imageDataUrl);

      const cleanedText = this.cleanExtractedText(text);

      return {
        success: true,
        text: cleanedText,
        confidence: confidence || 0.85,
        originalLength: text.length,
        cleanedLength: cleanedText.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        text: '',
        confidence: 0
      };
    }
  }

  cleanExtractedText(text) {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`\n]/g, '')
      .replace(/[Il1]/g, 'I')
      .replace(/[0O]/g, 'O')
      .trim();
  }

  isSupportedFileType(mimetype) {
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    return supportedTypes.includes(mimetype);
  }

  async processDocument(file, sessionId) {
    try {
      if (!this.isSupportedFileType(file.mimetype)) {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      const uploadResult = await uploadFileToSupabase(file, 'documents', `sessions/${sessionId}/`);

      if (!uploadResult.success) {
        throw new Error(`Failed to upload document: ${uploadResult.error}`);
      }

      const ocrResult = await this.extractTextFromImage(file);

      if (!ocrResult.success) {
        throw new Error(`OCR processing failed: ${ocrResult.error}`);
      }

      try {
        const { supabase } = await import('../config/supabase.js');
        const { data: docData, error: docError } = await supabase
          .from('processed_documents')
          .insert({
            session_id: sessionId,
            file_name: uploadResult.fileName,
            file_url: uploadResult.publicUrl,
            extracted_text: ocrResult.text,
            file_type: file.mimetype,
            file_size: file.size,
            ocr_confidence: ocrResult.confidence,
            uploaded_at: new Date().toISOString()
          })
          .select()
          .single();

      } catch (dbError) {
      }

      return {
        success: true,
        document: { fileName: uploadResult.fileName },
        ocr: ocrResult,
        publicUrl: uploadResult.publicUrl,
        fileName: uploadResult.fileName
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async terminate() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
      } catch (error) {
      }
    }
  }

  async healthCheck() {
    try {
      const workerReady = await this.ensureWorkerInitialized();
      return {
        status: workerReady ? 'healthy' : 'unhealthy',
        initialized: this.isInitialized,
        worker: this.worker ? 'active' : 'inactive'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        initialized: this.isInitialized,
        error: error.message
      };
    }
  }
}

const ocrService = new OCRService();
export default ocrService;