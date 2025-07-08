import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file and initiates download
 * @param data Array of objects to export
 * @param filename Name of the file to download (without extension)
 * @param sheetName Name of the sheet in the Excel file
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Convert buffer to Blob
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Format receipt data for Excel export
 * @param receipts Array of receipt objects
 * @returns Formatted data for Excel export
 */
export function formatReceiptsForExport(
  receipts: {
    id: number;
    vendor: string;
    date: string;
    totalAmount: string;
    category: string;
    items: { name: string; price: string }[];
    status?: string;
    notes?: string;
  }[]
) {
  return receipts.map(receipt => ({
    'Receipt ID': receipt.id,
    'Vendor': receipt.vendor,
    'Date': new Date(receipt.date).toLocaleDateString(),
    'Amount': receipt.totalAmount,
    'Category': receipt.category,
    'Status': receipt.status || 'Pending',
    'Notes': receipt.notes || '',
    'Items Count': receipt.items.length
  }));
}

/**
 * Format employee data for Excel export
 * @param employees Array of employee objects
 * @returns Formatted data for Excel export
 */
export function formatEmployeesForExport(employees: any[]) {
  return employees.map(employee => ({
    'Name': employee.name,
    'Position': employee.position,
    'Department': employee.department,
    'Email': employee.email,
    'Phone': employee.phone,
    'Start Date': new Date(employee.startDate).toLocaleDateString(),
    'Status': employee.status,
    'Hourly Rate': `$${employee.hourlySalary.toFixed(2)}`,
    'Skills': employee.skillTags?.join(', ') || ''
  }));
}

/**
 * Format equipment data for Excel export
 * @param equipment Array of equipment objects
 * @returns Formatted data for Excel export
 */
export function formatEquipmentForExport(equipmentList: any[]) {
  return equipmentList.map(item => ({
    'Name': item.name,
    'Type': item.type,
    'Model': item.model,
    'Serial Number': item.serialNumber,
    'Purchase Date': new Date(item.purchaseDate).toLocaleDateString(),
    'Purchase Price': `$${item.purchasePrice.toFixed(2)}`,
    'Status': item.status,
    'Last Serviced': item.lastServicedDate ? new Date(item.lastServicedDate).toLocaleDateString() : 'N/A',
    'Location': item.location,
    'Assigned To': item.assignedTo || 'Unassigned'
  }));
}

/**
 * Format payroll data for Excel export
 * @param payrollEntries Array of payroll entry objects
 * @returns Formatted data for Excel export
 */
export function formatPayrollForExport(payrollEntries: any[]) {
  return payrollEntries.map(entry => ({
    'Employee': entry.employeeName,
    'Pay Period': `${new Date(entry.periodStart).toLocaleDateString()} - ${new Date(entry.periodEnd).toLocaleDateString()}`,
    'Regular Hours': entry.regularHours,
    'Overtime Hours': entry.overtimeHours,
    'Regular Pay': `$${entry.regularPay.toFixed(2)}`,
    'Overtime Pay': `$${entry.overtimePay.toFixed(2)}`,
    'Adjustments': `$${entry.adjustments.toFixed(2)}`,
    'Total Pay': `$${entry.totalPay.toFixed(2)}`,
    'Status': entry.status || 'Pending'
  }));
} 