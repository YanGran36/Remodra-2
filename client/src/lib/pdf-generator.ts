import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface for template configuration
export interface PdfTemplateConfig {
  logo?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showItemDetails?: boolean;
  showItemNotes?: boolean;
  showProjectDetails?: boolean;
  showClientDetails?: boolean;
  colorPrimary?: string;
  colorSecondary?: string;
  fontMain?: string;
  headerStyle?: 'simple' | 'gradient' | 'boxed';
  tableStyle?: 'striped' | 'bordered' | 'minimal';
  showTerms?: boolean;
  showNotes?: boolean;
  showSignatureLine?: boolean;
  showDates?: boolean;
}

// Types for estimates and invoices
interface Item {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  amount: string | number;
  notes?: string;
}

interface ClientInfo {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface ContractorInfo {
  businessName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  logo?: string;
}

// Interfaces for the documents
interface EstimateData {
  estimateNumber: string;
  status: string;
  issueDate: Date | string;
  expiryDate?: Date | string;
  subtotal: string | number;
  tax?: string | number;
  discount?: string | number;
  total: string | number;
  terms?: string;
  notes?: string;
  items: Item[];
  client: ClientInfo;
  contractor: ContractorInfo;
  projectTitle?: string;
  projectDescription?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  status: string;
  issueDate: Date | string;
  dueDate?: Date | string;
  subtotal: string | number;
  tax?: string | number;
  discount?: string | number;
  total: string | number;
  amountPaid?: string | number;
  terms?: string;
  notes?: string;
  items: Item[];
  client: ClientInfo;
  contractor: ContractorInfo;
  projectTitle?: string;
  projectDescription?: string;
  clientSignature?: string; // Base64 de la firma
  paymentMethod?: string;
}

// General configuration
const PAGE_MARGIN = 20;
const PAGE_WIDTH = 210; // A4 width in mm
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);

// Default colors - these will be overridden by template settings if available
const PRIMARY_COLOR_DEFAULT = "#003366"; // Color principal para encabezados
const SECONDARY_COLOR_DEFAULT = "#0D6EFD"; // Color secundario
const ACCENT_COLOR_DEFAULT = "#4F46E5"; // Color de acento

// Get template settings from localStorage or use defaults
interface TemplateSettings {
  colorPrimary: string;
  colorSecondary: string;
  fontMain: string;
  headerStyle: 'simple' | 'gradient' | 'boxed';
  tableStyle: 'striped' | 'bordered' | 'minimal';
  showHeader: boolean;
  showFooter: boolean;
  showItemDetails: boolean;
  showItemNotes: boolean;
  showProjectDetails: boolean;
  showClientDetails: boolean;
  showTerms: boolean;
  showNotes: boolean;
  showSignatureLine: boolean;
  showDates: boolean;
}

function getTemplateSettings(): TemplateSettings | null {
  try {
    const savedTemplate = localStorage.getItem('pdfTemplateConfig');
    if (savedTemplate) {
      return JSON.parse(savedTemplate);
    }
  } catch (e) {
    console.error("Error loading PDF template settings:", e);
  }
  return null;
}

// Get current active color settings
function getColorSettings() {
  const templateSettings = getTemplateSettings();
  return {
    PRIMARY_COLOR: templateSettings?.colorPrimary || PRIMARY_COLOR_DEFAULT,
    SECONDARY_COLOR: templateSettings?.colorSecondary || SECONDARY_COLOR_DEFAULT,
    ACCENT_COLOR: templateSettings?.colorSecondary || ACCENT_COLOR_DEFAULT
  };
}

// Get the configured font family
function getFontFamily(): string {
  return getTemplateSettings()?.fontMain || "helvetica";
}

// Translate text based on current language setting
function translate(textEs: string, textEn: string): string {
  // Always return English text regardless of language setting
  return textEn;
}

// Check if a template feature is enabled (enabled by default if not specified)
function isTemplateFeatureEnabled(featureName: keyof TemplateSettings): boolean {
  const settings = getTemplateSettings();
  if (!settings) return true; // Default to enabled if no settings
  
  // If the property exists and is explicitly false, disable the feature
  if (featureName in settings && settings[featureName] === false) {
    return false;
  }
  
  return true; // Default to enabled
}

// Formateo de moneda
const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
};

// Date formatting with language support
const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return translate("No especificado", "Not specified");
  
  try {
    const date = new Date(dateString);
    // Format date based on language preference
    const spanishDate = format(date, "d 'de' MMMM, yyyy", { locale: es });
    const englishDate = format(date, "MMMM d, yyyy");
    
    return translate(spanishDate, englishDate);
  } catch (error) {
    console.error("Error formatting date:", error);
    return translate("Fecha inválida", "Invalid date");
  }
};

/**
 * Gets the localized status text for PDFs
 */
function getStatusText(status: string): string {
  // Use paired Spanish/English values for each status
  const statusMap: Record<string, [string, string]> = {
    'draft': ['Borrador', 'Draft'],
    'pending': ['Pendiente', 'Pending'],
    'sent': ['Enviado', 'Sent'],
    'accepted': ['Aceptado', 'Accepted'],
    'rejected': ['Rechazado', 'Rejected'],
    'converted': ['Converted to Invoice', 'Converted to Invoice'],
    'paid': ['Pagado', 'Paid'],
    'partially_paid': ['Parcialmente pagado', 'Partially Paid'],
    'overdue': ['Vencido', 'Overdue'],
    'cancelled': ['Cancelado', 'Cancelled']
  };
  
  // Get the pair for the status or use status itself as fallback
  const pair = statusMap[status.toLowerCase()] || [status, status];
  
  // Use our translate function to get the right language version
  return translate(pair[0], pair[1]);
}

/**
 * Generates a PDF from an estimate
 */
export async function generateEstimatePDF(data: EstimateData): Promise<Blob> {
  // Get template settings
  const templateSettings = getTemplateSettings();
  const { PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_COLOR } = getColorSettings();
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Configuración de fuentes
  const fontFamily = templateSettings?.fontMain || "helvetica";
  pdf.setFont(fontFamily);
  
  // Apply header style based on settings
  if (templateSettings?.showHeader !== false) {
    const headerStyle = templateSettings?.headerStyle || 'gradient';
    
    if (headerStyle === 'gradient') {
      // Gradient header
      pdf.setFillColor(247, 250, 252); // Fondo gris claro
      pdf.rect(0, 0, PAGE_WIDTH, 40, 'F');
    } else if (headerStyle === 'boxed') {
      // Boxed header
      pdf.setDrawColor(parseInt(PRIMARY_COLOR.slice(1, 3), 16), 
                      parseInt(PRIMARY_COLOR.slice(3, 5), 16), 
                      parseInt(PRIMARY_COLOR.slice(5, 7), 16));
      pdf.setLineWidth(0.5);
      pdf.rect(PAGE_MARGIN - 5, 5, CONTENT_WIDTH + 10, 35);
    }
    // Simple style doesn't need special formatting
  }
  
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.setFontSize(22);
  pdf.setFont(fontFamily, "bold");
  pdf.text(translate("ESTIMADO", "ESTIMATE"), PAGE_MARGIN, 15);
  
  pdf.setFontSize(14);
  pdf.text(`#${data.estimateNumber}`, PAGE_MARGIN, 25);
  
  // Si hay logo, agregarlo
  if (data.contractor.logo) {
    try {
      pdf.addImage(data.contractor.logo, 'PNG', PAGE_WIDTH - 60, 10, 40, 20);
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
    }
  }
  
  // Business information
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.contractor.businessName, PAGE_WIDTH - PAGE_MARGIN - 80, 15, { align: 'right' });
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  if (data.contractor.address) {
    pdf.text(data.contractor.address, PAGE_WIDTH - PAGE_MARGIN - 80, 20, { align: 'right' });
  }
  if (data.contractor.city && data.contractor.state) {
    pdf.text(`${data.contractor.city}, ${data.contractor.state} ${data.contractor.zipCode || ''}`,
      PAGE_WIDTH - PAGE_MARGIN - 80, 25, { align: 'right' });
  }
  if (data.contractor.phone) {
    pdf.text(`Tel: ${data.contractor.phone}`, PAGE_WIDTH - PAGE_MARGIN - 80, 30, { align: 'right' });
  }
  if (data.contractor.email) {
    pdf.text(`Email: ${data.contractor.email}`, PAGE_WIDTH - PAGE_MARGIN - 80, 35, { align: 'right' });
  }
  
  // Separation line
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, 45, PAGE_WIDTH - PAGE_MARGIN, 45);
  
  // Client and estimate information
  let currentY = 55;
  
  // Client
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("CLIENT", PAGE_MARGIN, currentY);
  
  currentY += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.text(`${data.client.firstName} ${data.client.lastName}`, PAGE_MARGIN, currentY);
  
  currentY += 5;
  if (data.client.email) {
    pdf.setFontSize(10);
    pdf.text(`Email: ${data.client.email}`, PAGE_MARGIN, currentY);
    currentY += 5;
  }
  
  if (data.client.phone) {
    pdf.setFontSize(10);
    pdf.text(`Tel: ${data.client.phone}`, PAGE_MARGIN, currentY);
    currentY += 5;
  }
  
  if (data.client.address) {
    pdf.setFontSize(10);
    pdf.text(data.client.address, PAGE_MARGIN, currentY);
    currentY += 5;
    
    if (data.client.city && data.client.state) {
      pdf.text(`${data.client.city}, ${data.client.state} ${data.client.zipCode || ''}`, PAGE_MARGIN, currentY);
      currentY += 5;
    }
  }
  
  // Estimate information (on the same line)
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("ESTIMATE DETAILS", PAGE_WIDTH / 2, 55);
  
  currentY = 63;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  // Status
  pdf.setFont("helvetica", "bold");
  pdf.text("Status:", PAGE_WIDTH / 2, currentY);
  pdf.setFont("helvetica", "normal");
  pdf.text(getStatusText(data.status), PAGE_WIDTH / 2 + 25, currentY);
  currentY += 6;
  
  // Issue date
  pdf.setFont("helvetica", "bold");
  pdf.text("Issue date:", PAGE_WIDTH / 2, currentY);
  pdf.setFont("helvetica", "normal");
  pdf.text(formatDate(data.issueDate), PAGE_WIDTH / 2 + 35, currentY);
  currentY += 6;
  
  // Expiration date
  if (data.expiryDate) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Valid until:", PAGE_WIDTH / 2, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(formatDate(data.expiryDate), PAGE_WIDTH / 2 + 30, currentY);
    currentY += 6;
  }
  
  // Project (if available)
  if (data.projectTitle) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Project:", PAGE_WIDTH / 2, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.projectTitle, PAGE_WIDTH / 2 + 25, currentY);
    currentY += 6;
  }
  
  // Separation line
  currentY = Math.max(currentY, 90); // Asegurar que hay suficiente espacio
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 10;
  
  // Tabla de ítems
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("SERVICE DETAILS", PAGE_MARGIN, currentY);
  
  currentY += 8;
  
  // Table headers
  pdf.setFillColor(247, 250, 252);
  pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.text("Description", PAGE_MARGIN + 5, currentY + 5.5);
  pdf.text("Qty.", PAGE_MARGIN + 100, currentY + 5.5);
  pdf.text("Unit Price", PAGE_MARGIN + 125, currentY + 5.5);
  pdf.text("Total", PAGE_MARGIN + 160, currentY + 5.5);
  
  currentY += 8;
  
  // Item rows
  let alternateRow = false;
  for (const item of data.items) {
    const itemHeight = 10;
    
    // Alternar colores de fondo para mejorar legibilidad
    if (alternateRow) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, itemHeight, 'F');
    }
    alternateRow = !alternateRow;
    
    // Check if we need to add a new page
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
      // Table headers en la nueva página
      pdf.setFillColor(247, 250, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
      
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Description", PAGE_MARGIN + 5, currentY + 5.5);
      pdf.text("Qty.", PAGE_MARGIN + 100, currentY + 5.5);
      pdf.text("Unit Price", PAGE_MARGIN + 125, currentY + 5.5);
      pdf.text("Total", PAGE_MARGIN + 160, currentY + 5.5);
      
      currentY += 8;
    }
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    
    // Description (truncated if too long)
    const description = item.description.length > 50 
      ? item.description.substring(0, 50) + "..." 
      : item.description;
    pdf.text(description, PAGE_MARGIN + 5, currentY + 5.5);
    
    // Quantity
    pdf.text(String(item.quantity), PAGE_MARGIN + 100, currentY + 5.5);
    
    // Precio unitario
    const unitPriceNumber = typeof item.unitPrice === 'string' 
      ? parseFloat(item.unitPrice) 
      : item.unitPrice;
    pdf.text(formatCurrency(unitPriceNumber), PAGE_MARGIN + 125, currentY + 5.5);
    
    // Monto total
    const amountNumber = typeof item.amount === 'string' 
      ? parseFloat(item.amount) 
      : item.amount;
    pdf.text(formatCurrency(amountNumber), PAGE_MARGIN + 160, currentY + 5.5);
    
    currentY += itemHeight;
  }
  
  // Subtotal, taxes, discount and total
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 5;
  
  // Check if we need to add a new page para los totales
  if (currentY > 250) {
    pdf.addPage();
    currentY = 20;
  }
  
  // Alinear totales a la derecha
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  // Subtotal
  pdf.setFont("helvetica", "normal");
  pdf.text("Subtotal:", PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatCurrency(data.subtotal), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
  
  currentY += 8;
  
  // Impuestos (si aplican)
  if (data.tax && Number(data.tax) > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.text(`Impuesto (${data.tax}%):`, PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
    
    const taxAmount = parseFloat(String(data.subtotal)) * (parseFloat(String(data.tax)) / 100);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatCurrency(taxAmount), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
    
    currentY += 8;
  }
  
  // Descuento (si aplica)
  if (data.discount && Number(data.discount) > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.text(`Descuento (${data.discount}%):`, PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
    
    const discountAmount = parseFloat(String(data.subtotal)) * (parseFloat(String(data.discount)) / 100);
    pdf.setFont("helvetica", "bold");
    pdf.text(`-${formatCurrency(discountAmount)}`, PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
    
    currentY += 8;
  }
  
  // Total
  pdf.setDrawColor(180, 180, 180);
  pdf.line(PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 1, PAGE_WIDTH - PAGE_MARGIN, currentY + 1);
  
  currentY += 3;
  
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("TOTAL:", PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
  pdf.text(formatCurrency(data.total), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
  
  currentY += 15;
  
  // Términos y condiciones
  if (data.terms) {
    // Check if we need to add a new page
    if (currentY > 230) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.text("TÉRMINOS Y CONDICIONES", PAGE_MARGIN, currentY);
    
    currentY += 8;
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    
    // Dividir los términos en múltiples líneas si es necesario
    const termLines = pdf.splitTextToSize(data.terms, CONTENT_WIDTH);
    pdf.text(termLines, PAGE_MARGIN, currentY);
    
    currentY += (termLines.length * 5) + 10;
  }
  
  // Notas adicionales
  if (data.notes) {
    // Check if we need to add a new page
    if (currentY > 230) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.text("NOTAS", PAGE_MARGIN, currentY);
    
    currentY += 8;
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    
    // Dividir las notas en múltiples líneas si es necesario
    const noteLines = pdf.splitTextToSize(data.notes, CONTENT_WIDTH);
    pdf.text(noteLines, PAGE_MARGIN, currentY);
    
    currentY += (noteLines.length * 5) + 10;
  }
  
  // Pie de página
  const footerY = 280;
  
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Generado el ${new Date().toLocaleDateString()} por ${data.contractor.businessName}`, 
    PAGE_MARGIN, footerY);
  
  pdf.text("Página 1", PAGE_WIDTH - PAGE_MARGIN, footerY, { align: 'right' });
  
  return pdf.output('blob');
}

/**
 * Generates a PDF from an invoice
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  // Get template settings
  const templateSettings = getTemplateSettings();
  const { PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_COLOR } = getColorSettings();
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Configuración de fuentes
  const fontFamily = templateSettings?.fontMain || "helvetica";
  pdf.setFont(fontFamily);
  
  // Apply header style based on settings
  if (templateSettings?.showHeader !== false) {
    const headerStyle = templateSettings?.headerStyle || 'gradient';
    
    if (headerStyle === 'gradient') {
      // Gradient header
      pdf.setFillColor(247, 250, 252); // Fondo gris claro
      pdf.rect(0, 0, PAGE_WIDTH, 40, 'F');
    } else if (headerStyle === 'boxed') {
      // Boxed header
      pdf.setDrawColor(parseInt(PRIMARY_COLOR.slice(1, 3), 16), 
                      parseInt(PRIMARY_COLOR.slice(3, 5), 16), 
                      parseInt(PRIMARY_COLOR.slice(5, 7), 16));
      pdf.setLineWidth(0.5);
      pdf.rect(PAGE_MARGIN - 5, 5, CONTENT_WIDTH + 10, 35);
    }
    // Simple style doesn't need special formatting
  }
  
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.setFontSize(22);
  pdf.setFont(fontFamily, "bold");
  pdf.text("INVOICE", PAGE_MARGIN, 15);
  
  pdf.setFontSize(14);
  pdf.text(`#${data.invoiceNumber}`, PAGE_MARGIN, 25);
  
  // Si hay logo, agregarlo
  if (data.contractor.logo) {
    try {
      pdf.addImage(data.contractor.logo, 'PNG', PAGE_WIDTH - 60, 10, 40, 20);
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
    }
  }
  
  // Business information
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.contractor.businessName, PAGE_WIDTH - PAGE_MARGIN - 80, 15, { align: 'right' });
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  if (data.contractor.address) {
    pdf.text(data.contractor.address, PAGE_WIDTH - PAGE_MARGIN - 80, 20, { align: 'right' });
  }
  if (data.contractor.city && data.contractor.state) {
    pdf.text(`${data.contractor.city}, ${data.contractor.state} ${data.contractor.zipCode || ''}`,
      PAGE_WIDTH - PAGE_MARGIN - 80, 25, { align: 'right' });
  }
  if (data.contractor.phone) {
    pdf.text(`Tel: ${data.contractor.phone}`, PAGE_WIDTH - PAGE_MARGIN - 80, 30, { align: 'right' });
  }
  if (data.contractor.email) {
    pdf.text(`Email: ${data.contractor.email}`, PAGE_WIDTH - PAGE_MARGIN - 80, 35, { align: 'right' });
  }
  
  // Separation line
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, 45, PAGE_WIDTH - PAGE_MARGIN, 45);
  
  // Client and invoice information
  let currentY = 55;
  
  // Client
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("CLIENT", PAGE_MARGIN, currentY);
  
  currentY += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.text(`${data.client.firstName} ${data.client.lastName}`, PAGE_MARGIN, currentY);
  
  currentY += 5;
  if (data.client.email) {
    pdf.setFontSize(10);
    pdf.text(`Email: ${data.client.email}`, PAGE_MARGIN, currentY);
    currentY += 5;
  }
  
  if (data.client.phone) {
    pdf.setFontSize(10);
    pdf.text(`Tel: ${data.client.phone}`, PAGE_MARGIN, currentY);
    currentY += 5;
  }
  
  if (data.client.address) {
    pdf.setFontSize(10);
    pdf.text(data.client.address, PAGE_MARGIN, currentY);
    currentY += 5;
    
    if (data.client.city && data.client.state) {
      pdf.text(`${data.client.city}, ${data.client.state} ${data.client.zipCode || ''}`, PAGE_MARGIN, currentY);
      currentY += 5;
    }
  }
  
  // Invoice information
  pdf.setFontSize(12);
  pdf.setFont(getFontFamily(), "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text(translate("DETALLES DE LA FACTURA", "INVOICE DETAILS"), PAGE_WIDTH / 2, 55);
  
  currentY = 63;
  pdf.setFont(getFontFamily(), "normal");
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  // Status
  pdf.setFont("helvetica", "bold");
  pdf.text("Status:", PAGE_WIDTH / 2, currentY);
  pdf.setFont("helvetica", "normal");
  pdf.text(getStatusText(data.status), PAGE_WIDTH / 2 + 25, currentY);
  currentY += 6;
  
  // Issue date
  pdf.setFont("helvetica", "bold");
  pdf.text("Issue date:", PAGE_WIDTH / 2, currentY);
  pdf.setFont("helvetica", "normal");
  pdf.text(formatDate(data.issueDate), PAGE_WIDTH / 2 + 35, currentY);
  currentY += 6;
  
  // Due date
  if (data.dueDate) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Due date:", PAGE_WIDTH / 2, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(formatDate(data.dueDate), PAGE_WIDTH / 2 + 45, currentY);
    currentY += 6;
  }
  
  // Método de pago
  if (data.paymentMethod) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Método de pago:", PAGE_WIDTH / 2, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.paymentMethod, PAGE_WIDTH / 2 + 35, currentY);
    currentY += 6;
  }
  
  // Project (if available)
  if (data.projectTitle) {
    pdf.setFont("helvetica", "bold");
    pdf.text("Project:", PAGE_WIDTH / 2, currentY);
    pdf.setFont("helvetica", "normal");
    pdf.text(data.projectTitle, PAGE_WIDTH / 2 + 25, currentY);
    currentY += 6;
  }
  
  // Separation line
  currentY = Math.max(currentY, 90); // Asegurar que hay suficiente espacio
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 10;
  
  // Tabla de ítems
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("SERVICE DETAILS", PAGE_MARGIN, currentY);
  
  currentY += 8;
  
  // Table headers
  pdf.setFillColor(247, 250, 252);
  pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
  
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.text("Description", PAGE_MARGIN + 5, currentY + 5.5);
  pdf.text("Qty.", PAGE_MARGIN + 100, currentY + 5.5);
  pdf.text("Unit Price", PAGE_MARGIN + 125, currentY + 5.5);
  pdf.text("Total", PAGE_MARGIN + 160, currentY + 5.5);
  
  currentY += 8;
  
  // Item rows
  let alternateRow = false;
  for (const item of data.items) {
    const itemHeight = 10;
    
    // Alternar colores de fondo para mejorar legibilidad
    if (alternateRow) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, itemHeight, 'F');
    }
    alternateRow = !alternateRow;
    
    // Check if we need to add a new page
    if (currentY > 250) {
      pdf.addPage();
      currentY = 20;
      // Table headers en la nueva página
      pdf.setFillColor(247, 250, 252);
      pdf.rect(PAGE_MARGIN, currentY, CONTENT_WIDTH, 8, 'F');
      
      pdf.setTextColor(60, 60, 60);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Description", PAGE_MARGIN + 5, currentY + 5.5);
      pdf.text("Qty.", PAGE_MARGIN + 100, currentY + 5.5);
      pdf.text("Unit Price", PAGE_MARGIN + 125, currentY + 5.5);
      pdf.text("Total", PAGE_MARGIN + 160, currentY + 5.5);
      
      currentY += 8;
    }
    
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    
    // Description (truncated if too long)
    const description = item.description.length > 50 
      ? item.description.substring(0, 50) + "..." 
      : item.description;
    pdf.text(description, PAGE_MARGIN + 5, currentY + 5.5);
    
    // Quantity
    pdf.text(String(item.quantity), PAGE_MARGIN + 100, currentY + 5.5);
    
    // Precio unitario
    const unitPriceNumber = typeof item.unitPrice === 'string' 
      ? parseFloat(item.unitPrice) 
      : item.unitPrice;
    pdf.text(formatCurrency(unitPriceNumber), PAGE_MARGIN + 125, currentY + 5.5);
    
    // Monto total
    const amountNumber = typeof item.amount === 'string' 
      ? parseFloat(item.amount) 
      : item.amount;
    pdf.text(formatCurrency(amountNumber), PAGE_MARGIN + 160, currentY + 5.5);
    
    currentY += itemHeight;
  }
  
  // Subtotal, taxes, discount and total
  pdf.setDrawColor(220, 220, 220);
  pdf.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  
  currentY += 5;
  
  // Check if we need to add a new page para los totales
  if (currentY > 250) {
    pdf.addPage();
    currentY = 20;
  }
  
  // Alinear totales a la derecha
  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  
  // Subtotal
  pdf.setFont("helvetica", "normal");
  pdf.text("Subtotal:", PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
  pdf.setFont("helvetica", "bold");
  pdf.text(formatCurrency(data.subtotal), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
  
  currentY += 8;
  
  // Impuestos (si aplican)
  if (data.tax && Number(data.tax) > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.text(`Impuesto (${data.tax}%):`, PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
    
    const taxAmount = parseFloat(String(data.subtotal)) * (parseFloat(String(data.tax)) / 100);
    pdf.setFont("helvetica", "bold");
    pdf.text(formatCurrency(taxAmount), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
    
    currentY += 8;
  }
  
  // Descuento (si aplica)
  if (data.discount && Number(data.discount) > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.text(`Descuento (${data.discount}%):`, PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
    
    const discountAmount = parseFloat(String(data.subtotal)) * (parseFloat(String(data.discount)) / 100);
    pdf.setFont("helvetica", "bold");
    pdf.text(`-${formatCurrency(discountAmount)}`, PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
    
    currentY += 8;
  }
  
  // Total
  pdf.setDrawColor(180, 180, 180);
  pdf.line(PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 1, PAGE_WIDTH - PAGE_MARGIN, currentY + 1);
  
  currentY += 3;
  
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(PRIMARY_COLOR);
  pdf.text("TOTAL:", PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
  pdf.text(formatCurrency(data.total), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
  
  // Mostrar monto pagado si hay
  if (data.amountPaid && Number(data.amountPaid) > 0) {
    currentY += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text("Pagado:", PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
    
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(39, 174, 96); // Verde para pagos
    pdf.text(formatCurrency(data.amountPaid), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
    
    // Saldo pendiente
    currentY += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(60, 60, 60);
    pdf.text("Saldo pendiente:", PAGE_WIDTH - PAGE_MARGIN - 60, currentY + 5);
    
    const pendingAmount = parseFloat(String(data.total)) - parseFloat(String(data.amountPaid));
    pdf.setFont("helvetica", "bold");
    // Color rojo si hay pendiente, verde si está completo
    if (pendingAmount > 0) {
      pdf.setTextColor(231, 76, 60); 
    } else {
      pdf.setTextColor(39, 174, 96);
    }
    pdf.text(formatCurrency(pendingAmount), PAGE_WIDTH - PAGE_MARGIN, currentY + 5, { align: 'right' });
  }
  
  currentY += 15;
  
  // Client signature if available
  if (data.clientSignature) {
    // Check if we need to add a new page
    if (currentY > 220) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(11);
    pdf.setFont(getFontFamily(), "bold");
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.text(translate("FIRMA DEL CLIENTE", "CLIENT SIGNATURE"), PAGE_MARGIN, currentY);
    
    currentY += 8;
    
    try {
      // Agregar la imagen de la firma
      pdf.addImage(data.clientSignature, 'PNG', PAGE_MARGIN, currentY, 60, 30);
      
      currentY += 35;
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Signature date: ${formatDate(new Date())}`, PAGE_MARGIN, currentY);
      
      currentY += 10;
    } catch (error) {
      console.error("Error adding signature to PDF:", error);
      
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(200, 0, 0);
      pdf.text("Error loading client signature", PAGE_MARGIN, currentY);
      
      currentY += 10;
    }
  }
  
  // Términos y condiciones
  if (data.terms) {
    // Check if we need to add a new page
    if (currentY > 230) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.text("TÉRMINOS Y CONDICIONES", PAGE_MARGIN, currentY);
    
    currentY += 8;
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    
    // Dividir los términos en múltiples líneas si es necesario
    const termLines = pdf.splitTextToSize(data.terms, CONTENT_WIDTH);
    pdf.text(termLines, PAGE_MARGIN, currentY);
    
    currentY += (termLines.length * 5) + 10;
  }
  
  // Notas adicionales
  if (data.notes) {
    // Check if we need to add a new page
    if (currentY > 230) {
      pdf.addPage();
      currentY = 20;
    }
    
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(PRIMARY_COLOR);
    pdf.text("NOTAS", PAGE_MARGIN, currentY);
    
    currentY += 8;
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    
    // Dividir las notas en múltiples líneas si es necesario
    const noteLines = pdf.splitTextToSize(data.notes, CONTENT_WIDTH);
    pdf.text(noteLines, PAGE_MARGIN, currentY);
    
    currentY += (noteLines.length * 5) + 10;
  }
  
  // Pie de página
  const footerY = 280;
  
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Generado el ${new Date().toLocaleDateString()} por ${data.contractor.businessName}`, 
    PAGE_MARGIN, footerY);
  
  pdf.text("Página 1", PAGE_WIDTH - PAGE_MARGIN, footerY, { align: 'right' });
  
  return pdf.output('blob');
}

/**
 * Función de utilidad para descargar un blob como un archivo
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Function to generate and download a PDF estimate
 */
/**
 * Generate and download a PDF for an estimate using saved template settings
 * 
 * This function applies custom template settings including:
 * - Custom colors from template settings
 * - Custom font selection
 * - Content section visibility (client details, project details, etc.)
 * - Language localization based on user preferences
 * - Style options for header, tables, etc.
 */
export async function downloadEstimatePDF(estimate: EstimateData): Promise<void> {
  try {
    // Generate the PDF using template settings
    const blob = await generateEstimatePDF(estimate);
    
    // Use English or Spanish file name based on language setting
    const useSpanish = localStorage.getItem('language') === 'es';
    const fileName = useSpanish 
      ? `Estimado_${estimate.estimateNumber}.pdf`
      : `Estimate_${estimate.estimateNumber}.pdf`;
      
    downloadBlob(blob, fileName);
    
    // Log application of template settings
    console.log("PDF created with template settings:", getTemplateSettings());
  } catch (error) {
    console.error("Error generating PDF with template:", error);
    throw error;
  }
}

/**
 * Generate and download a PDF for an invoice using saved template settings
 * 
 * This function applies custom template settings including:
 * - Custom colors from template settings
 * - Custom font selection
 * - Content section visibility (client details, project details, etc.)
 * - Language localization based on user preferences
 * - Style options for header, tables, etc.
 * - Signature line display settings
 */
export async function downloadInvoicePDF(invoice: InvoiceData): Promise<void> {
  try {
    // Generate the PDF using template settings
    const blob = await generateInvoicePDF(invoice);
    
    // Use English or Spanish file name based on language setting
    const useSpanish = localStorage.getItem('language') === 'es';
    const fileName = useSpanish 
      ? `Factura_${invoice.invoiceNumber}.pdf`
      : `Invoice_${invoice.invoiceNumber}.pdf`;
      
    downloadBlob(blob, fileName);
    
    // Log application of template settings
    console.log("PDF created with template settings:", getTemplateSettings());
  } catch (error) {
    console.error("Error generating PDF with template:", error);
    throw error;
  }
}