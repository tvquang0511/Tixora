import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

import { TEST_SPECIFICATIONS } from '../fixtures/test-cases.catalog';

interface TestCaseRecord {
  index: number;
  id: string;
  module: string;
  title: string;
  browser: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'TIMED_OUT';
  durationSeconds: number;
  preconditions: string;
  steps: string;
  expected: string;
  actual: string;
  errorMessage?: string;
  errorStack?: string;
  remediation?: string;
}

export default class ExcelReporter implements Reporter {
  private startTime: number = 0;
  private records: TestCaseRecord[] = [];
  private reportDir: string;

  constructor() {
    this.reportDir = path.resolve(__dirname, '..', 'reports', 'e2e');
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  onBegin(_config: FullConfig, _suite: Suite): void {
    this.startTime = Date.now();
    this.records = [];
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const title = test.title;
    const tcMatch = title.match(/(TC-[A-Z0-9]+-\d+)/i);
    const tcId = tcMatch ? tcMatch[1].toUpperCase() : `TC-E2E-${String(this.records.length + 1).padStart(2, '0')}`;

    // Lấy đặc tả từ từ điển QA
    const spec = TEST_SPECIFICATIONS[tcId] || {
      module: 'General E2E',
      preconditions: 'Môi trường kiểm thử đang hoạt động',
      steps: `Thực hiện kịch bản: ${title}`,
      expected: 'Các hành vi giao diện phản hồi đúng đặc tả',
    };

    let status: TestCaseRecord['status'] = 'PASS';
    if (result.status === 'timedOut') {
      status = 'TIMED_OUT';
    } else if (result.status === 'failed') {
      status = 'FAIL';
    } else if (result.status === 'skipped') {
      status = 'SKIPPED';
    }

    let errorMessage: string | undefined;
    let errorStack: string | undefined;
    let remediation: string | undefined;

    if (result.error) {
      errorMessage = (result.error.message || '').replace(/\u001b\[[0-9;]*m/g, '').trim();
      errorStack = (result.error.stack || '').replace(/\u001b\[[0-9;]*m/g, '').trim();

      if (errorMessage.includes('timeout') || errorMessage.includes('Timed out')) {
        remediation = 'Phần tử không xuất hiện kịp thời. Kiểm tra Render Cloud có bị cold start hoặc tăng timeout locator.';
      } else if (errorMessage.includes('toBeVisible')) {
        remediation = 'Bộ chọn (Selector) không khớp với giao diện thực tế hoặc trang bị chuyển hướng về /login (lỗi phiên đăng nhập).';
      } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
        remediation = 'Lỗi phân quyền hoặc token xác thực hết hạn/không hợp lệ.';
      } else {
        remediation = 'Kiểm tra log lỗi backend hoặc kết nối mạng internet đến Cloud.';
      }
    }

    const durationSec = Number((result.duration / 1000).toFixed(2));
    const actual =
      status === 'PASS'
        ? `Thực thi thành công trong ${durationSec}s. Tất cả điều kiện kiểm tra đều thỏa mãn.`
        : `Thất bại sau ${durationSec}s. Lỗi: ${errorMessage ? errorMessage.split('\n')[0].slice(0, 120) : 'Unknown failure'}`;

    const browser = (test as any)._projectName || (test.parent as any)?.project?.()?.name || 'Desktop Chrome';

    this.records.push({
      index: this.records.length + 1,
      id: tcId,
      module: spec.module,
      title: title.replace(/^(TC-[A-Z0-9]+-\d+[:\s-]*)/i, '').trim(),
      browser,
      status,
      durationSeconds: durationSec,
      preconditions: spec.preconditions,
      steps: spec.steps,
      expected: spec.expected,
      actual,
      errorMessage,
      errorStack,
      remediation,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (this.records.length === 0) return;

    const totalDurationSeconds = Number(((Date.now() - this.startTime) / 1000).toFixed(1));
    const totalTests = this.records.length;
    const passedTests = this.records.filter((r) => r.status === 'PASS').length;
    const failedTests = this.records.filter((r) => r.status === 'FAIL' || r.status === 'TIMED_OUT').length;
    const skippedTests = this.records.filter((r) => r.status === 'SKIPPED').length;
    const passRate = totalTests > 0 ? Number(((passedTests / totalTests) * 100).toFixed(1)) : 0;

    const now = new Date();
    const dateFormatted = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
    const dateDisplay = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    // ─────────────────────────────────────────────────────────────
    // 1. IN DANH SÁCH CHI TIẾT TỪNG TEST CASE RA TERMINAL
    // ─────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(100));
    console.log('📋  BÁO CÁO NGHIỆM THU KIỂM THỬ E2E — CHI TIẾT TỪNG TEST CASE (INDIVIDUAL TEST AUDIT)');
    console.log('═'.repeat(100));

    this.records.forEach((r) => {
      const isPass = r.status === 'PASS';
      const icon = isPass ? '  ✔ PASS ' : r.status === 'SKIPPED' ? '  ↷ SKIP ' : '  ✖ FAIL ';
      const color = isPass ? '\x1b[32m' : r.status === 'SKIPPED' ? '\x1b[33m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(`${color}${icon}${reset} | \x1b[1m${r.id.padEnd(11)}\x1b[0m | \x1b[36m[${r.module.padEnd(23)}]\x1b[0m | ${r.title} (${r.durationSeconds}s)`);
      if (r.errorMessage) {
        console.log(`         \x1b[31m├─ Nguyên nhân:\x1b[0m ${r.errorMessage.split('\n')[0].slice(0, 95)}`);
        if (r.remediation) {
          console.log(`         \x1b[33m└─ Khuyến nghị:\x1b[0m ${r.remediation}`);
        }
      }
    });

    console.log('─'.repeat(100));
    console.log(
      `📊  TỔNG KẾT: \x1b[32m${passedTests} ĐẠT (PASS)\x1b[0m | \x1b[31m${failedTests} LỖI (FAIL)\x1b[0m | \x1b[33m${skippedTests} BỎ QUA\x1b[0m | Tỷ Lệ Đạt: \x1b[1m${passRate}%\x1b[0m | Tổng thời gian: ${totalDurationSeconds}s`
    );
    console.log('═'.repeat(100));

    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. SINH BÁO CÁO EXCEL SIÊU CHI TIẾT (EXCEL DOSSIER)
    // ─────────────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tixora Enterprise QA System';
    workbook.created = now;

    const NAVY = '0E54A3';
    const SLATE = '1E293B';
    const BORDER_COLOR = 'CBD5E1';

    // ── SHEET 1: EXECUTIVE SUMMARY ──
    const summarySheet = workbook.addWorksheet('Executive_Summary', { views: [{ showGridLines: true }] });
    summarySheet.columns = [{ width: 4 }, { width: 30 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 24 }];

    summarySheet.mergeCells('B2:F2');
    const banner = summarySheet.getCell('B2');
    banner.value = 'TIXORA PLATFORM — E2E TEST EXECUTION SUMMARY';
    banner.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    banner.alignment = { vertical: 'middle', horizontal: 'center' };
    banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    summarySheet.getRow(2).height = 40;

    const targetEnv = process.env.WEB_URL?.includes('localhost') ? 'Localhost (:3001, :3002)' : 'Cloud Deployed (Staging)';
    const infoRows = [
      ['Thời gian chạy:', dateDisplay, 'Môi trường kiểm thử:', targetEnv],
      ['Tổng thời gian:', `${totalDurationSeconds}s`, 'Framework tự động:', 'Playwright E2E + Custom QA Reporter'],
      ['Người thực thi:', 'QA Automation Lead', 'Chuẩn tài liệu:', 'ISO/IEC/IEEE 29119 Test Documentation'],
    ];

    let rowIdx = 4;
    infoRows.forEach((row) => {
      const r = summarySheet.getRow(rowIdx);
      r.getCell(2).value = row[0];
      r.getCell(2).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: SLATE } };
      r.getCell(3).value = row[1];
      r.getCell(3).font = { name: 'Segoe UI', size: 10 };
      r.getCell(4).value = row[2];
      r.getCell(4).font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: SLATE } };
      r.getCell(5).value = row[3];
      r.getCell(5).font = { name: 'Segoe UI', size: 10 };
      r.height = 22;
      rowIdx++;
    });

    // KPI Table
    summarySheet.getCell('B8').value = 'BẢNG CHỈ SỐ CHẤT LƯỢNG NGHIỆM THU (OVERALL QUALITY METRICS)';
    summarySheet.getCell('B8').font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: NAVY } };

    const kpiHeaderRow = summarySheet.getRow(9);
    kpiHeaderRow.height = 28;
    ['Tổng Ca Test', 'Số Ca Đạt (PASS)', 'Số Ca Lỗi (FAIL)', 'Bỏ Qua (SKIP)', 'Tỷ Lệ Đạt (%)'].forEach((h, idx) => {
      const cell = kpiHeaderRow.getCell(idx + 2);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SLATE } };
    });

    const kpiValRow = summarySheet.getRow(10);
    kpiValRow.height = 36;
    [
      { val: totalTests, bg: 'F1F5F9', fg: '0F172A' },
      { val: passedTests, bg: 'DCFCE7', fg: '15803D' },
      { val: failedTests, bg: failedTests > 0 ? 'FEE2E2' : 'F1F5F9', fg: failedTests > 0 ? 'B91C1C' : '64748B' },
      { val: skippedTests, bg: 'FEF3C7', fg: 'B45309' },
      { val: `${passRate}%`, bg: passRate >= 90 ? 'DCFCE7' : 'FEE2E2', fg: passRate >= 90 ? '15803D' : 'B91C1C' },
    ].forEach((kv, idx) => {
      const cell = kpiValRow.getCell(idx + 2);
      cell.value = kv.val;
      cell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: kv.fg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: kv.bg } };
    });

    // Module Breakdown Table
    summarySheet.getCell('B12').value = 'PHÂN BỐ THEO PHÂN HỆ NGHIỆP VỤ (MODULE BREAKDOWN)';
    summarySheet.getCell('B12').font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: NAVY } };

    const mHeaderRow = summarySheet.getRow(13);
    mHeaderRow.height = 26;
    ['Phân Hệ Nghiệp Vụ', 'Tổng Test', 'Số Ca Đạt', 'Số Ca Lỗi', 'Tỷ Lệ Hoàn Thành'].forEach((h, idx) => {
      const cell = mHeaderRow.getCell(idx + 2);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: '475569' };
    });

    const distinctModules = Array.from(new Set(this.records.map((r) => r.module)));
    let modRowIdx = 14;
    distinctModules.forEach((mod) => {
      const modTests = this.records.filter((r) => r.module === mod);
      const modPass = modTests.filter((r) => r.status === 'PASS').length;
      const modFail = modTests.filter((r) => r.status === 'FAIL' || r.status === 'TIMED_OUT').length;
      const modRate = modTests.length > 0 ? `${((modPass / modTests.length) * 100).toFixed(0)}%` : '0%';

      const r = summarySheet.getRow(modRowIdx);
      r.height = 22;
      r.getCell(2).value = mod;
      r.getCell(2).font = { bold: true };
      r.getCell(3).value = modTests.length;
      r.getCell(3).alignment = { horizontal: 'center' };
      r.getCell(4).value = modPass;
      r.getCell(4).alignment = { horizontal: 'center' };
      r.getCell(4).font = { color: { argb: '15803D' }, bold: true };
      r.getCell(5).value = modFail;
      r.getCell(5).alignment = { horizontal: 'center' };
      if (modFail > 0) r.getCell(5).font = { color: { argb: 'B91C1C' }, bold: true };
      r.getCell(6).value = modRate;
      r.getCell(6).alignment = { horizontal: 'center' };
      r.getCell(6).font = { bold: true };
      modRowIdx++;
    });

    // ── SHEET 2: CHI TIẾT TỪNG TEST CASE (EXHAUSTIVE DOSSIER) ──
    const detailsSheet = workbook.addWorksheet('Chi_Tiet_Tung_Test_Case', { views: [{ showGridLines: true }] });
    detailsSheet.columns = [
      { width: 6 },   // A: STT
      { width: 15 },  // B: Mã TC
      { width: 24 },  // C: Phân hệ
      { width: 38 },  // D: Tên kịch bản
      { width: 36 },  // E: Tiền điều kiện
      { width: 44 },  // F: Các bước kiểm tra
      { width: 36 },  // G: Kết quả mong đợi
      { width: 42 },  // H: Kết quả thực tế
      { width: 14 },  // I: Trạng thái
      { width: 14 },  // J: Thời gian (s)
      { width: 45 },  // K: Khuyến nghị khắc phục (nếu lỗi)
    ];

    const detailHeaders = [
      'STT',
      'Mã Test Case',
      'Phân Hệ',
      'Tên Kịch Bản Kiểm Thử',
      'Tiền Điều Kiện (Preconditions)',
      'Các Bước Thực Hiện (Steps)',
      'Kết Quả Mong Đợi (Expected)',
      'Kết Quả Thực Tế (Actual)',
      'Trạng Thái',
      'Thời Gian',
      'Khuyến Nghị Khắc Phục (Remediation)',
    ];

    const dHeadRow = detailsSheet.getRow(2);
    dHeadRow.height = 32;
    detailHeaders.forEach((h, idx) => {
      const cell = dHeadRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    });

    this.records.forEach((rec, idx) => {
      const row = detailsSheet.getRow(idx + 3);
      row.height = 38;

      row.getCell(1).value = rec.index;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(2).value = rec.id;
      row.getCell(2).font = { bold: true };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(3).value = rec.module;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(4).value = rec.title;
      row.getCell(4).font = { bold: true };
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };

      row.getCell(5).value = rec.preconditions;
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      row.getCell(6).value = rec.steps;
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      row.getCell(7).value = rec.expected;
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      row.getCell(8).value = rec.actual;
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      const statusCell = row.getCell(9);
      statusCell.value = rec.status;
      statusCell.font = { bold: true };
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (rec.status === 'PASS') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
        statusCell.font = { color: { argb: '15803D' }, bold: true };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
        statusCell.font = { color: { argb: 'B91C1C' }, bold: true };
      }

      row.getCell(10).value = `${rec.durationSeconds}s`;
      row.getCell(10).alignment = { vertical: 'middle', horizontal: 'center' };

      row.getCell(11).value = rec.remediation || 'Không có lỗi';
      row.getCell(11).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      for (let c = 1; c <= 11; c++) {
        row.getCell(c).border = { bottom: { style: 'thin', color: { argb: BORDER_COLOR } } };
      }
    });

    detailsSheet.autoFilter = `A2:K${this.records.length + 2}`;

    // ── SHEET 3: NHẬT KÝ LỖI (DEFECTS LOG) ──
    const defectsSheet = workbook.addWorksheet('Nhat_Ky_Loi_Defects', { views: [{ showGridLines: true }] });
    defectsSheet.columns = [
      { width: 6 },   // STT
      { width: 16 },  // Mã TC
      { width: 22 },  // Phân hệ
      { width: 35 },  // Kịch bản
      { width: 16 },  // Mức độ
      { width: 45 },  // Nguyên nhân lỗi
      { width: 45 },  // Khuyến nghị sửa lỗi
    ];

    const defHeadRow = defectsSheet.getRow(2);
    defHeadRow.height = 30;
    ['STT', 'Mã Test Case', 'Phân Hệ', 'Tên Kịch Bản', 'Mức Độ', 'Nguyên Nhân Lỗi Chi Tiết', 'Khuyến Nghị Khắc Phục'].forEach((h, idx) => {
      const cell = defHeadRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: idx >= 6 ? 'left' : 'center' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'B91C1C' } };
    });

    const failedRecords = this.records.filter((r) => r.status === 'FAIL' || r.status === 'TIMED_OUT');
    if (failedRecords.length === 0) {
      defectsSheet.mergeCells('A3:G3');
      const emptyNotice = defectsSheet.getCell('A3');
      emptyNotice.value = '✔ Không phát hiện lỗi nào trong phiên kiểm thử này. Toàn bộ kịch bản đều PASS!';
      emptyNotice.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: '15803D' } };
      emptyNotice.alignment = { vertical: 'middle', horizontal: 'center' };
      defectsSheet.getRow(3).height = 35;
    } else {
      failedRecords.forEach((f, idx) => {
        const row = defectsSheet.getRow(idx + 3);
        row.height = 35;
        row.getCell(1).value = idx + 1;
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(2).value = f.id;
        row.getCell(2).font = { bold: true };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(3).value = f.module;
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(4).value = f.title;
        row.getCell(5).value = 'Major';
        row.getCell(5).font = { bold: true, color: { argb: 'B91C1C' } };
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(6).value = f.errorMessage ? f.errorMessage.split('\n')[0] : 'Unknown error';
        row.getCell(6).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        row.getCell(7).value = f.remediation || 'Kiểm tra log server';
        row.getCell(7).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      });
    }

    const timestampedPath = path.join(this.reportDir, `Tixora_Test_Report_${dateFormatted}.xlsx`);
    const latestExcelPath = path.join(this.reportDir, 'Tixora_Test_Report_Latest.xlsx');

    await workbook.xlsx.writeFile(timestampedPath);
    await workbook.xlsx.writeFile(latestExcelPath);

    // ─────────────────────────────────────────────────────────────
    // 3. SINH BÁO CÁO HTML DASHBOARD ĐỘC LẬP (STANDALONE HTML REPORT)
    // ─────────────────────────────────────────────────────────────
    const latestHtmlPath = path.join(this.reportDir, 'Tixora_E2E_Test_Report_Latest.html');
    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Tixora E2E Test Report — Chi Tiết Từng Test Case</title>
  <style>
    :root { --primary: #0e54a3; --navy-dark: #0a3d78; --bg: #f8fafc; --text: #0f172a; --pass: #16a34a; --fail: #dc2626; --card-bg: #ffffff; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; line-height: 1.5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, var(--primary), var(--navy-dark)); color: white; padding: 28px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(14,84,163,0.15); }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: var(--card-bg); border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0; text-align: center; }
    .kpi-val { font-size: 32px; font-weight: 700; margin-top: 4px; }
    .kpi-pass { color: var(--pass); }
    .kpi-fail { color: var(--fail); }
    .test-list { display: flex; flex-direction: column; gap: 14px; }
    .test-card { background: var(--card-bg); border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; transition: all 0.2s; }
    .test-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .test-header { padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .badge-pass { background: #dcfce7; color: #15803d; }
    .badge-fail { background: #fee2e2; color: #b91c1c; }
    .badge-module { background: #e0f2fe; color: #0369a1; margin-left: 8px; }
    .test-id { font-weight: 700; font-size: 15px; margin-right: 8px; }
    .test-body { padding: 20px; font-size: 13px; background: #fafafa; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
    .meta-box { background: white; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .meta-box strong { display: block; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; color: #991b1b; font-family: monospace; font-size: 12px; margin-top: 10px; white-space: pre-wrap; }
    .remedy-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; color: #92400e; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 TIXORA — BÁO CÁO NGHIỆM THU KIỂM THỬ TỰ ĐỘNG E2E</h1>
      <p>Thời gian: ${dateDisplay} | Môi trường: ${targetEnv} | Tổng thời gian: ${totalDurationSeconds}s</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card"><div>TỔNG CA TEST</div><div class="kpi-val">${totalTests}</div></div>
      <div class="kpi-card"><div>SỐ CA ĐẠT</div><div class="kpi-val kpi-pass">${passedTests}</div></div>
      <div class="kpi-card"><div>SỐ CA LỖI</div><div class="kpi-val kpi-fail">${failedTests}</div></div>
      <div class="kpi-card"><div>TỶ LỆ ĐẠT</div><div class="kpi-val ${passRate >= 90 ? 'kpi-pass' : 'kpi-fail'}">${passRate}%</div></div>
    </div>

    <h2 style="font-size: 18px; margin-bottom: 16px; color: var(--navy-dark);">📋 HỒ SƠ CHI TIẾT TỪNG TEST CASE (${this.records.length} KỊCH BẢN)</h2>
    <div class="test-list">
      ${this.records
        .map(
          (r) => `
      <div class="test-card" style="border-left: 5px solid ${r.status === 'PASS' ? '#16a34a' : '#dc2626'};">
        <div class="test-header">
          <div>
            <span class="test-id">${r.id}</span>
            <span style="font-weight: 600;">${r.title}</span>
            <span class="badge badge-module">${r.module}</span>
          </div>
          <div>
            <span style="font-size: 12px; color: #64748b; margin-right: 12px;">⏱ ${r.durationSeconds}s</span>
            <span class="badge ${r.status === 'PASS' ? 'badge-pass' : 'badge-fail'}">${r.status}</span>
          </div>
        </div>
        <div class="test-body">
          <div class="meta-grid">
            <div class="meta-box"><strong>Tiền điều kiện:</strong>${r.preconditions}</div>
            <div class="meta-box"><strong>Kết quả mong đợi:</strong>${r.expected}</div>
          </div>
          <div class="meta-box" style="margin-bottom: 12px;"><strong>Các bước thực hiện:</strong><div style="white-space: pre-line;">${r.steps}</div></div>
          <div class="meta-box"><strong>Kết quả thực tế:</strong>${r.actual}</div>
          ${r.errorMessage ? `<div class="error-box"><strong>CHI TIẾT LỖI KỸ THUẬT:</strong>\n${r.errorMessage}</div>` : ''}
          ${r.remediation ? `<div class="remedy-box"><strong>💡 KHUYẾN NGHỊ KHẮC PHỤC:</strong> ${r.remediation}</div>` : ''}
        </div>
      </div>`
        )
        .join('')}
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(latestHtmlPath, htmlContent, 'utf-8');

    console.log(`\n📂 File Báo Cáo Excel Nghiệm Thu: ${latestExcelPath}`);
    console.log(`🌐 File Dashboard Báo Cáo HTML:     ${latestHtmlPath}\n`);
  }
}
