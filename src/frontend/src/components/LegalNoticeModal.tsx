import React, { useState, useRef, useEffect } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { Report } from '../backend';

interface LegalNoticeModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  formatLocationDisplay: () => string;
  formatDate: (timestamp: bigint) => string;
}

export function LegalNoticeModal({ report, isOpen, onClose, imageUrl, formatLocationDisplay, formatDate }: LegalNoticeModalProps) {
  // Section 1: Your Details
  const [yourName, setYourName] = useState('');
  const [yourContact, setYourContact] = useState('');
  const [yourAddress, setYourAddress] = useState('');
  const [yourEmail, setYourEmail] = useState('');

  // Section 2: Recipient/Offender/Entity Details
  const [recipientName, setRecipientName] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [violationNature, setViolationNature] = useState('');

  // Section 3: Incident Details
  const [whatWentWrong, setWhatWentWrong] = useState(report.notes || '');
  const [howAffected, setHowAffected] = useState('');

  // Section 4: Signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Checkboxes
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [consentProcessing, setConsentProcessing] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Initialize canvas for signature
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const isFormValid = () => {
    return (
      yourName.trim() &&
      yourContact.trim() &&
      yourAddress.trim() &&
      yourEmail.trim() &&
      recipientName.trim() &&
      recipientAddress.trim() &&
      violationNature.trim() &&
      whatWentWrong.trim() &&
      howAffected.trim() &&
      hasSignature &&
      confirmAccuracy &&
      consentProcessing
    );
  };

  // Get image dimensions and calculate aspect ratio
  const getImageDimensions = async (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        // Default dimensions if image fails to load
        resolve({ width: 800, height: 600 });
      };
      img.src = url;
    });
  };

  // Convert image URL to base64
  const imageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  // Simple CRC32 implementation for ZIP
  const crc32 = (data: Uint8Array): number => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  // Create ZIP file manually
  const createZip = (files: Array<{ path: string; content: string | Uint8Array }>): Uint8Array => {
    const encoder = new TextEncoder();
    const centralDirectory: Uint8Array[] = [];
    const fileData: Uint8Array[] = [];
    let offset = 0;

    files.forEach((file) => {
      const pathBytes = encoder.encode(file.path);
      const contentBytes = typeof file.content === 'string' 
        ? encoder.encode(file.content) 
        : file.content;
      
      const crc = crc32(contentBytes);
      
      // Local file header
      const localHeader = new Uint8Array(30 + pathBytes.length);
      const view = new DataView(localHeader.buffer);
      
      view.setUint32(0, 0x04034b50, true); // signature
      view.setUint16(4, 20, true); // version
      view.setUint16(6, 0, true); // flags
      view.setUint16(8, 0, true); // compression
      view.setUint16(10, 0, true); // time
      view.setUint16(12, 0, true); // date
      view.setUint32(14, crc, true); // crc32
      view.setUint32(18, contentBytes.length, true); // compressed size
      view.setUint32(22, contentBytes.length, true); // uncompressed size
      view.setUint16(26, pathBytes.length, true); // filename length
      view.setUint16(28, 0, true); // extra field length
      
      localHeader.set(pathBytes, 30);
      
      fileData.push(localHeader);
      fileData.push(contentBytes);
      
      // Central directory header
      const cdHeader = new Uint8Array(46 + pathBytes.length);
      const cdView = new DataView(cdHeader.buffer);
      
      cdView.setUint32(0, 0x02014b50, true); // signature
      cdView.setUint16(4, 20, true); // version made by
      cdView.setUint16(6, 20, true); // version needed
      cdView.setUint16(8, 0, true); // flags
      cdView.setUint16(10, 0, true); // compression
      cdView.setUint16(12, 0, true); // time
      cdView.setUint16(14, 0, true); // date
      cdView.setUint32(16, crc, true); // crc32
      cdView.setUint32(20, contentBytes.length, true); // compressed size
      cdView.setUint32(24, contentBytes.length, true); // uncompressed size
      cdView.setUint16(28, pathBytes.length, true); // filename length
      cdView.setUint16(30, 0, true); // extra field length
      cdView.setUint16(32, 0, true); // comment length
      cdView.setUint16(34, 0, true); // disk number
      cdView.setUint16(36, 0, true); // internal attributes
      cdView.setUint32(38, 0, true); // external attributes
      cdView.setUint32(42, offset, true); // relative offset
      
      cdHeader.set(pathBytes, 46);
      centralDirectory.push(cdHeader);
      
      offset += localHeader.length + contentBytes.length;
    });
    
    // Calculate sizes
    const cdSize = centralDirectory.reduce((sum, cd) => sum + cd.length, 0);
    
    // End of central directory
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    
    eocdView.setUint32(0, 0x06054b50, true); // signature
    eocdView.setUint16(4, 0, true); // disk number
    eocdView.setUint16(6, 0, true); // disk with central directory
    eocdView.setUint16(8, files.length, true); // entries on this disk
    eocdView.setUint16(10, files.length, true); // total entries
    eocdView.setUint32(12, cdSize, true); // central directory size
    eocdView.setUint32(16, offset, true); // central directory offset
    eocdView.setUint16(20, 0, true); // comment length
    
    // Combine all parts
    const totalSize = offset + cdSize + eocd.length;
    const result = new Uint8Array(totalSize);
    let pos = 0;
    
    fileData.forEach(data => {
      result.set(data, pos);
      pos += data.length;
    });
    
    centralDirectory.forEach(cd => {
      result.set(cd, pos);
      pos += cd.length;
    });
    
    result.set(eocd, pos);
    
    return result;
  };

  // Convert canvas signature to base64
  const getSignatureBase64 = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not found'));
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }, 'image/png');
    });
  };

  const generateLegalNotice = async () => {
    if (!isFormValid()) {
      alert('Please complete all required fields and sign the document.');
      return;
    }

    setIsGenerating(true);

    try {
      // Get signature as base64
      const signatureBase64 = await getSignatureBase64();

      // Get issue photo as base64 if available
      let issuePhotoBase64 = '';
      let issuePhotoDimensions = { width: 800, height: 600 };
      
      if (imageUrl) {
        try {
          issuePhotoDimensions = await getImageDimensions(imageUrl);
          issuePhotoBase64 = await imageToBase64(imageUrl);
        } catch (error) {
          console.error('Failed to embed issue photo:', error);
          alert('Warning: Could not embed the issue photo. The document will be generated without it.');
        }
      }

      // Calculate proportional dimensions for the issue photo - same as PrintableComplaintModal
      const maxWidthEMU = 2571750; // 4.5 inches in EMUs
      const aspectRatio = issuePhotoDimensions.width / issuePhotoDimensions.height;
      let issuePhotoWidthEMU = maxWidthEMU;
      let issuePhotoHeightEMU = Math.round(maxWidthEMU / aspectRatio);
      
      // If height is too large, constrain by height instead - 3.6 inches
      const maxHeightEMU = 2057280;
      if (issuePhotoHeightEMU > maxHeightEMU) {
        issuePhotoHeightEMU = maxHeightEMU;
        issuePhotoWidthEMU = Math.round(maxHeightEMU * aspectRatio);
      }

      // Signature dimensions (2 inches wide, 1 inch tall)
      const signatureWidthEMU = 1828800;
      const signatureHeightEMU = 914400;

      // Escape XML special characters
      const escapeXml = (text: string) => {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      };

      // Create .docx file structure using Open XML format
      const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" 
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>LEGAL NOTICE</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Date: ${new Date().toLocaleDateString('en-IN')}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>TO:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(recipientName)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(recipientAddress)}</w:t></w:r>
    </w:p>
    ${recipientContact ? `<w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Contact: ${escapeXml(recipientContact)}</w:t></w:r>
    </w:p>` : ''}
    ${recipientEmail ? `<w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Email: ${escapeXml(recipientEmail)}</w:t></w:r>
    </w:p>` : '<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>'}
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>FROM:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(yourName)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(yourAddress)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Contact: ${escapeXml(yourContact)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Email: ${escapeXml(yourEmail)}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:u w:val="single"/><w:sz w:val="24"/></w:rPr><w:t>SUBJECT: Legal Notice regarding ${escapeXml(report.issueType)} at ${escapeXml(formatLocationDisplay())}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="120"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Dear Sir/Madam,</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>I am writing to formally notify you of a serious civic issue that requires your immediate attention and action. This notice is issued under the relevant provisions of law.</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>1. NATURE OF VIOLATION:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(violationNature)}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>2. INCIDENT DETAILS:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Issue Type: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(report.issueType)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Location: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(formatLocationDisplay())}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Coordinates: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Date &amp; Time: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(formatDate(report.timestamp))}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Report ID: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(report.id)}</w:t></w:r>
    </w:p>
    
    ${issuePhotoBase64 ? `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>Issue Photo:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${issuePhotoWidthEMU}" cy="${issuePhotoHeightEMU}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="2" name="Issue Photo"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="Issue Photo"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId2"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${issuePhotoWidthEMU}" cy="${issuePhotoHeightEMU}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    ` : ''}
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>3. WHAT WENT WRONG:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(whatWentWrong)}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>4. HOW THIS HAS AFFECTED ME/US:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(howAffected)}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>5. DEMAND FOR ACTION:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>I hereby demand that you take immediate and appropriate action to resolve this matter within 15 days from the receipt of this notice. Failure to do so will compel me to take further legal action without any further notice to you.</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>This notice is issued without prejudice to my rights and remedies available under law.</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="120"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Yours faithfully,</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="60"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${signatureWidthEMU}" cy="${signatureHeightEMU}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="1" name="Signature"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="0" name="Signature"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="rId1"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${signatureWidthEMU}" cy="${signatureHeightEMU}"/>
                    </a:xfrm>
                    <a:prstGeom prst="rect">
                      <a:avLst/>
                    </a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="280"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(yourName)}</w:t></w:r>
    </w:p>
    
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

      // Create relationships file
      const relsXml = issuePhotoBase64 
        ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/signature.png"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/issue.jpeg"/>
</Relationships>`
        : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/signature.png"/>
</Relationships>`;

      // Create content types file
      const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  ${issuePhotoBase64 ? '<Default Extension="jpeg" ContentType="image/jpeg"/>' : ''}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

      // Create main relationships file
      const mainRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

      // Convert signature base64 to Uint8Array
      const binaryString = atob(signatureBase64);
      const signatureBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        signatureBytes[i] = binaryString.charCodeAt(i);
      }

      // Prepare files for ZIP
      const files: Array<{ path: string; content: string | Uint8Array }> = [
        { path: '[Content_Types].xml', content: contentTypesXml },
        { path: '_rels/.rels', content: mainRelsXml },
        { path: 'word/document.xml', content: docXml },
        { path: 'word/_rels/document.xml.rels', content: relsXml },
        { path: 'word/media/signature.png', content: signatureBytes }
      ];

      // Add issue photo if available
      if (issuePhotoBase64) {
        const issueBinaryString = atob(issuePhotoBase64);
        const issuePhotoBytes = new Uint8Array(issueBinaryString.length);
        for (let i = 0; i < issueBinaryString.length; i++) {
          issuePhotoBytes[i] = issueBinaryString.charCodeAt(i);
        }
        files.push({ path: 'word/media/issue.jpeg', content: issuePhotoBytes });
      }

      // Create ZIP
      const zipData = createZip(files);
      
      // Create blob and download
      const blob = new Blob([zipData.slice(0)], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LegalNotice_${report.id}_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Legal Notice downloaded successfully! The .docx file is ready for editing in Microsoft Word or Google Docs.');
      onClose();
    } catch (error) {
      console.error('Error generating legal notice:', error);
      alert('Failed to generate legal notice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1100] p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Generate Legal Notice</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Fill in the details below to generate a professional legal notice document (.docx format) with the issue photo embedded for this civic issue report.
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Section 1: Your Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Your Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name / Organization Name *
                </label>
                <input
                  type="text"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name or organization name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  value={yourContact}
                  onChange={(e) => setYourContact(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complete Address *
                </label>
                <textarea
                  value={yourAddress}
                  onChange={(e) => setYourAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter your complete address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={yourEmail}
                  onChange={(e) => setYourEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Recipient Details */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Recipient/Offender/Entity Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name / Company Name *
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter recipient's name or company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  value={recipientContact}
                  onChange={(e) => setRecipientContact(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter recipient's contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complete Address *
                </label>
                <textarea
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter recipient's complete address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter recipient's email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nature of Violation *
                </label>
                <textarea
                  value={violationNature}
                  onChange={(e) => setViolationNature(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe the nature of the violation"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Incident Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Incident Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What Went Wrong *
                </label>
                <textarea
                  value={whatWentWrong}
                  onChange={(e) => setWhatWentWrong(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Describe what went wrong (pre-filled from report notes)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  How Has This Affected You *
                </label>
                <textarea
                  value={howAffected}
                  onChange={(e) => setHowAffected(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Explain how this issue has affected you or your community"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Signature */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">4. Signature *</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Please sign below using your mouse or touchscreen:</p>
              <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-40 cursor-crosshair touch-none"
                  style={{ touchAction: 'none' }}
                />
              </div>
              <button
                onClick={clearSignature}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear Signature
              </button>
            </div>
          </div>

          {/* Mandatory Checkboxes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirmation Required</h3>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmAccuracy}
                onChange={(e) => setConfirmAccuracy(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I confirm that all information provided is accurate and true to the best of my knowledge.
              </span>
            </label>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentProcessing}
                onChange={(e) => setConsentProcessing(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I consent to data processing per Privacy Policy and understand CivicReport is not a law firm and does not provide legal advice.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={generateLegalNotice}
              disabled={!isFormValid() || isGenerating}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Legal Notice (.docx)</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> The legal notice will be downloaded as a professionally formatted .docx file with your signature and the issue photo embedded as actual images. You can open it in Microsoft Word, Google Docs, or any word processor for further editing and printing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
