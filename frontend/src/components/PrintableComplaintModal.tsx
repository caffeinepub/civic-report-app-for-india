import React, { useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { Report } from '../backend';

interface PrintableComplaintModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  formatLocationDisplay: () => string;
  formatDate: (timestamp: bigint) => string;
}

export function PrintableComplaintModal({
  report,
  isOpen,
  onClose,
  imageUrl,
  formatLocationDisplay,
  formatDate
}: PrintableComplaintModalProps) {
  const [complainerName, setComplainerName] = useState(report.username || '');
  const [localCivicBodyName, setLocalCivicBodyName] = useState(
    report.localCivicBody?.bodyName || ''
  );
  const [contactMobile, setContactMobile] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

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

  const handleGenerate = async () => {
    if (!complainerName.trim()) {
      alert('Please enter the complainer name');
      return;
    }

    setIsGenerating(true);

    try {
      let imageBase64 = '';
      let imageDimensions = { width: 800, height: 600 };
      
      if (imageUrl) {
        try {
          imageDimensions = await getImageDimensions(imageUrl);
          imageBase64 = await imageToBase64(imageUrl);
        } catch (error) {
          console.error('Failed to embed image:', error);
          alert('Warning: Could not embed the issue photo. The document will be generated without it.');
        }
      }

      // Calculate proportional dimensions for the image - increased from 4 inches to 4.5 inches
      const maxWidthEMU = 2571750; // 4.5 inches in EMUs (914400 EMUs per inch * 4.5 = 4114800, reduced to 2571750 for better fit)
      const aspectRatio = imageDimensions.width / imageDimensions.height;
      let imageWidthEMU = maxWidthEMU;
      let imageHeightEMU = Math.round(maxWidthEMU / aspectRatio);
      
      // If height is too large, constrain by height instead - increased from 3.2 to 3.6 inches
      const maxHeightEMU = 2057280; // 3.6 inches
      if (imageHeightEMU > maxHeightEMU) {
        imageHeightEMU = maxHeightEMU;
        imageWidthEMU = Math.round(maxHeightEMU * aspectRatio);
      }

      // Create .docx file structure using Open XML format with compact layout
      const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" 
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="80"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Date &amp; Time: ${formatDate(report.timestamp)}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Complaint ID: ${report.id}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>To: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${localCivicBodyName.trim() || '___________________________'}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>From: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${complainerName.trim()}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Contact: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${contactMobile.trim() || 'N/A'}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr>
      <w:r><w:rPr><w:b/><w:u w:val="single"/><w:sz w:val="24"/></w:rPr><w:t>Subject: Complaint Regarding ${report.issueType}</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Issue Details:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Type: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${report.issueType}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="120"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Full Address: </w:t></w:r>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${formatLocationDisplay()}</w:t></w:r>
    </w:p>
    
    ${imageBase64 ? `
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Issue Photo:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:after="120"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0">
            <wp:extent cx="${imageWidthEMU}" cy="${imageHeightEMU}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="1" name="Issue Photo"/>
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
                    <a:blip r:embed="rId1"/>
                    <a:stretch>
                      <a:fillRect/>
                    </a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm>
                      <a:off x="0" y="0"/>
                      <a:ext cx="${imageWidthEMU}" cy="${imageHeightEMU}"/>
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
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="100"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Dear Sir/Madam,</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="both"/><w:spacing w:after="140"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>A </w:t></w:r>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${report.issueType}</w:t></w:r>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t> has been reported at </w:t></w:r>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${formatLocationDisplay()}</w:t></w:r>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>. This poses a risk to public safety and requires immediate attention.</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="60"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Action Requested:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="ListParagraph"/>
        <w:numPr>
          <w:ilvl w:val="0"/>
          <w:numId w:val="1"/>
        </w:numPr>
        <w:spacing w:after="40"/>
      </w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Conduct urgent inspection and resolve the issue.</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="ListParagraph"/>
        <w:numPr>
          <w:ilvl w:val="0"/>
          <w:numId w:val="1"/>
        </w:numPr>
        <w:spacing w:after="160"/>
      </w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Implement regular maintenance to prevent recurrence.</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/>
        <w:spacing w:before="100" w:after="100"/>
      </w:pPr>
      <w:r><w:rPr><w:b/><w:i/><w:sz w:val="20"/></w:rPr><w:t>Declaration:</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:shd w:val="clear" w:color="auto" w:fill="F5F5F5"/>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="20"/></w:rPr><w:t>I hereby certify that the information provided is true to the best of my knowledge. This complaint was generated via the CivicReport app.</w:t></w:r>
    </w:p>
    
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="280"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Signature: _______________________</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/><w:spacing w:after="40"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Name: ${complainerName.trim()}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="left"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Date: ${new Date().toLocaleDateString('en-IN')}</w:t></w:r>
    </w:p>
    
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

      // Create relationships file
      const relsXml = imageBase64 ? `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.jpeg"/>
</Relationships>` : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

      // Create content types file
      const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  ${imageBase64 ? '<Default Extension="jpeg" ContentType="image/jpeg"/>' : ''}
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

      // Create main relationships file
      const mainRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

      // Prepare files for ZIP
      const files: Array<{ path: string; content: string | Uint8Array }> = [
        { path: '[Content_Types].xml', content: contentTypesXml },
        { path: '_rels/.rels', content: mainRelsXml },
        { path: 'word/document.xml', content: docXml },
        { path: 'word/_rels/document.xml.rels', content: relsXml }
      ];

      // Add image if available
      if (imageBase64) {
        // Convert base64 to Uint8Array
        const binaryString = atob(imageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        files.push({ path: 'word/media/image1.jpeg', content: bytes });
      }

      // Create ZIP
      const zipData = createZip(files);
      
      // Create blob and download - use slice to create a proper copy
      const blob = new Blob([zipData.slice(0)], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaint-${report.id}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Complaint document generated successfully! The .docx file is ready for editing and submission.');
      onClose();
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Generate Printable Complaint</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Fill in the details below to generate an editable .docx complaint document with the issue photo embedded. These details are session-specific and won't affect the original report.
          </p>

          <div className="space-y-4 mb-6">
            {/* Complainer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complainer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={complainerName}
                onChange={(e) => setComplainerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Local Civic Body Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Civic Body Name <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={localCivicBodyName}
                onChange={(e) => setLocalCivicBodyName(e.target.value)}
                placeholder="e.g., Municipal Corporation, Panchayat"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank if not applicable
              </p>
            </div>

            {/* Contact Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Mobile Number <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="tel"
                value={contactMobile}
                onChange={(e) => setContactMobile(e.target.value)}
                placeholder="Enter mobile number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The generated document will be a fully editable .docx file with the issue photo embedded as an actual image. You can open it in Microsoft Word, Google Docs, or any word processor for editing and official submission.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !complainerName.trim()}
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
                  <span>Generate .docx</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
