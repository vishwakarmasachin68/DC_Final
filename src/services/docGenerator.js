import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';

const formatDateToReadable = (isoDate) => {
  try {
    const dateObj = new Date(isoDate);
    return dateObj.toLocaleDateString('en-GB', {
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
    const response = await fetch('/templates/challan-template.docx');
    if (!response.ok) throw new Error('Failed to load Word template');

    const arrayBuffer = await response.arrayBuffer();

    const zip = new PizZip(arrayBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const items = challan.items.map((item, index) => ({
      SLNo: index + 1,
      asset: item.assetName,
      desc: item.description,
      qty: item.quantity,
      serial: item.serialNo,
      return: item.returnable,
    }));

    const hasReturnableItems = items.some(item => item.return === 'Yes');
    const returnableStatus = hasReturnableItems ? 'RETURNABLE' : 'NON-RETURNABLE';

    doc.setData({
      Name: challan.name,
      Client: challan.client,
      Location: challan.location,
      DCNO: challan.dcNumber,
      Date: formatDateToReadable(challan.date),
      items: items,
      returnStatus: returnableStatus
    });

    doc.render();

    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    saveAs(blob, `Delivery_Challan_${challan.dcNumber}.docx`);
  } catch (error) {
    console.error('Document generation error:', error);
    alert(`Error generating document: ${error.message}`);
  }
};
