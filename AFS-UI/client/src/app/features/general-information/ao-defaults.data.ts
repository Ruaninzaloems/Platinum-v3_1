export const AO_RESPONSIBILITIES_ITEMS = [
  { label: "Accounting Officer's Responsibilities and Approval", lineType: 'header' as const },
  { label: 'The Accounting Officer is required by the Municipal Finance Management Act (Act 56 of 2003), to maintain adequate accounting records and is responsible for the content and integrity of the annual financial statements and related financial information included in this report. It is the responsibility of the Accounting Officer to ensure that the annual financial statements fairly present the state of affairs of the municipality as at the end of the financial year and the results of its operations and cash flows for the period then ended. The external auditors are engaged to express an independent opinion on the annual financial statements and was given unrestricted access to all financial records and related data.', lineType: 'text' as const },
  { label: 'The annual financial statements were prepared in accordance with Standards of Generally Recognised Accounting Practice (GRAP) as well as relevant interpretations, guidelines and directives issued by the Accounting Standards Board.', lineType: 'text' as const },
  { label: 'The annual financial statements are based upon appropriate accounting policies consistently applied and supported by reasonable and prudent judgements and estimates.', lineType: 'text' as const },
  { label: "The Accounting Officer acknowledges that they are ultimately responsible for the system of internal financial control established by the municipality and place considerable importance on maintaining a strong control environment. To enable the Accounting Officer to meet these responsibilities, standards for internal control have been set aimed at reducing the risk of error or deficit in a cost-effective manner. The standards include the proper delegation of responsibilities within a clearly defined framework, effective accounting procedures and adequate segregation of duties to ensure an acceptable level of risk. These controls are monitored throughout the municipality and all employees are required to maintain the highest ethical standards in ensuring the municipality's business is conducted in a manner that in all reasonable circumstances is above reproach. The focus of risk management in the municipality is on identifying, assessing, managing and monitoring all known forms of risk across the municipality. While operating risk cannot be fully eliminated, the municipality endeavours to minimise it by ensuring that appropriate infrastructure, controls, systems and ethical behaviour are applied and managed within predetermined procedures and constraints.", lineType: 'text' as const },
  { label: "The Accounting Officer is of the opinion, based on the information and explanations given by management, that the system of internal control provides reasonable assurance that the financial records may be relied on for the preparation of the annual financial statements. However, any system of internal financial control can provide only reasonable, and not absolute, assurance against material misstatement or deficit.", lineType: 'text' as const },
  { label: 'B-BBEE Compliance', lineType: 'sub_header' as const },
  { label: 'In terms of Section 13G, read with regulation 12 of the B-BBEE Regulations, all spheres of government, public entities and organs of state must report on their compliance with broad-based black empowerment in their audited annual financial statements and annual reports.', lineType: 'text' as const },
  { label: 'Going Concern', lineType: 'sub_header' as const },
  { label: "The Accounting Officer has reviewed the municipality's cash flow forecast for the year and, in the light of this review and the current financial position, is satisfied that the municipality has or has access to adequate resources to continue in operational existence for the foreseeable future.", lineType: 'text' as const },
  { label: 'Councillor Remuneration Certification', lineType: 'sub_header' as const },
  { label: "The Accounting Officer certifies that the salaries, allowances and benefits of councillors as disclosed in the notes to these annual financial statements are within the upper limits of the framework envisaged in section 219 of the Constitution of the Republic of South Africa, read with the Remuneration of Public Office Bearers Act, Act 20 of 1998 and the Minister of Provincial and Local Government's determination in accordance with the Act.", lineType: 'text' as const },
  { label: 'Approval', lineType: 'sub_header' as const },
  { label: 'The annual financial statements set out in terms of Section 126(1) of the Municipal Finance Management Act (Act 56 of 2003), which have been prepared on the going concern basis, were approved by the Accounting Officer.', lineType: 'text' as const },
];

export const AO_REPORT_ITEMS = [
  { label: "Accounting Officer's Report", lineType: 'header' as const },
  { label: '1. Review of activities', lineType: 'sub_header' as const },
  { label: 'Main business and operations', lineType: 'sub_header' as const },
  { label: 'The municipality is engaged in local government activities, which include planning and promotion of integrated development plan and supplying of the services to the community.', lineType: 'text' as const },
  { label: '2. Going concern', lineType: 'sub_header' as const },
  { label: 'The financial statements have been prepared on the basis of accounting policies applicable to a going concern. This basis presumes that funds will be available to finance future operations and that the realisation of assets and settlement of liabilities, contingent obligations and commitments will occur in the ordinary course of business. All impairments were measured and judged in line with past performances.', lineType: 'text' as const },
  { label: '3. Subsequent events', lineType: 'sub_header' as const },
  { label: 'The accounting officer is not aware of any matter or circumstance arising since the end of the financial year, that may need to be adjusted for or disclosed in the Financial Statements.', lineType: 'text' as const },
  { label: "4. Accounting Officers' interest in contracts", lineType: 'sub_header' as const },
  { label: 'The accounting officer has no interest in contracts awarded, either direct or indirect.', lineType: 'text' as const },
  { label: '5. Accounting policies', lineType: 'sub_header' as const },
  { label: 'The annual financial statements prepared in accordance with the Municipal Finance Management Act (MFMA) and effective standards of Generally Recognised Accounting Practices (GRAP), including any interpretations of such Statements issued by the Accounting Standards Board (ASB) in accordance with Section 122(3) of the Municipal Finance Management Act, (Act No 56 of 2003).', lineType: 'text' as const },
  { label: 'Accounting policies for material transactions, events or conditions not covered by the GRAP reporting framework, have been developed in accordance with paragraphs 8, 10 and 11 of GRAP 3 and the hierarchy approved in Directive 5 issued by the Accounting Standards Board.', lineType: 'text' as const },
  { label: '6. Accounting Officer', lineType: 'sub_header' as const },
  { label: 'The accounting officers of the municipality during the year and to the date of this report are as follows:', lineType: 'text' as const },
  { label: '7. Corporate governance', lineType: 'sub_header' as const },
  { label: 'The accounting officer is committed to business integrity, transparency and professionalism in all its activities. As part of this commitment, the accounting officer supports the highest standards of corporate governance and the ongoing development of best practice.', lineType: 'text' as const },
  { label: "The municipality confirms and acknowledges its responsibility to total compliance with the Code of Corporate Practices and Conduct laid out in the King Report IV on Corporate Governance for South Africa. The accounting officer discusses the responsibilities of management in this respect, at Council meetings and monitors the municipality's compliance with the Code on a quarterly basis.", lineType: 'text' as const },
];

export function buildAoDefaultText(items: { label: string; lineType: string }[]): string {
  return items
    .filter(li => li.lineType === 'text' || li.lineType === 'sub_header')
    .map(li => li.label)
    .filter(l => l.length > 0)
    .join('\n\n');
}
