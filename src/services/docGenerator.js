import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const formatDateToReadable = (isoDate) => {
  try {
    const dateObj = new Date(isoDate);
    return dateObj.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
};

export const generateDoc = async (challan) => {
  try {
    // Load the template
    const response = await fetch('/templates/challan-template.docx');
    if (!response.ok) throw new Error('Failed to load Word template');

    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);
    
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Prepare data for the document
    const items = challan.items.map((item, index) => ({
      SLNo: index + 1,
      asset: item.assetName,
      desc: item.description,
      qty: item.quantity,
      serial: item.serialNo,
      return: item.returnable ? 'Yes' : 'No',
      returnDate: item.returnable ? formatDateToReadable(item.expectedReturnDate) : 'N/A'
    }));

    const hasReturnableItems = items.some(item => item.return === 'Yes');
    const returnableStatus = hasReturnableItems ? 'RETURNABLE' : 'NON-RETURNABLE';

    // Set the template variables
    doc.setData({
      Name: challan.name,
      Client: challan.clientName || challan.client,
      Location: challan.locationName || challan.location,
      DCNO: challan.dcNumber,
      Date: formatDateToReadable(challan.date),
      PONumber: challan.hasPO === 'yes' ? challan.poNumber : 'N/A',
      items: items,
      returnStatus: returnableStatus,
      hasReturnableItems: hasReturnableItems
    });

    try {
      doc.render();
    } catch (error) {
      console.error('Template rendering error:', error);
      throw new Error('Failed to render document template');
    }

    // Generate the document
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Save the document
    saveAs(blob, `Delivery_Challan_${challan.dcNumber.replace(/\//g, '_')}.docx`);
    
    return { success: true, filename: `Delivery_Challan_${challan.dcNumber}.docx` };
  } catch (error) {
    console.error('Document generation error:', error);
    throw new Error(`Failed to generate document: ${error.message}`);
  }
};