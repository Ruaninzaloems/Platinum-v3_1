const SARS_TAX_DEFAULTS = {
  2025: {
    brackets: [
      { bracket_number: 1, min_income: 0, max_income: 237100, base_tax: 0, rate: 18 },
      { bracket_number: 2, min_income: 237101, max_income: 370500, base_tax: 42678, rate: 26 },
      { bracket_number: 3, min_income: 370501, max_income: 512800, base_tax: 77362, rate: 31 },
      { bracket_number: 4, min_income: 512801, max_income: 673000, base_tax: 121475, rate: 36 },
      { bracket_number: 5, min_income: 673001, max_income: 857900, base_tax: 179147, rate: 39 },
      { bracket_number: 6, min_income: 857901, max_income: 1817000, base_tax: 251258, rate: 41 },
      { bracket_number: 7, min_income: 1817001, max_income: null, base_tax: 644489, rate: 45 },
    ],
    rebates: [
      { rebate_type: 'PRIMARY', amount: 17235, age_threshold: 0 },
      { rebate_type: 'SECONDARY', amount: 9444, age_threshold: 65 },
      { rebate_type: 'TERTIARY', amount: 3145, age_threshold: 75 },
    ],
    thresholds: [
      { threshold_type: 'below_65', age_group: 'below_65', amount: 95750 },
      { threshold_type: '65_to_74', age_group: '65_to_74', amount: 148217 },
      { threshold_type: '75_and_over', age_group: '75_and_over', amount: 165689 },
    ],
    medical_tax_credits: {
      main_member: 364,
      first_dependant: 364,
      additional_dependant: 246,
    },
    uif: {
      employee_rate: 1,
      employer_rate: 1,
      ceiling: 17712,
    },
    sdl: {
      rate: 1,
      threshold: 500000,
    },
    prescribed_rates: [
      { description: 'Travel – Reimbursive Rate per km', subtype_index: 'Local', irp5_code: '3702', rate: 4.64 },
      { description: 'S&T Local – Meals and Incidental Costs', subtype_index: 'Local – Meals and Incidental Costs', irp5_code: '3704', rate: 548.00 },
      { description: 'S&T Local – Incidental Costs Only', subtype_index: 'Local – Incidental Costs', irp5_code: '3704', rate: 169.00 },
      { description: 'S&T Foreign – Deemed Allowance', subtype_index: 'Foreign', irp5_code: '3715', rate: 855.00 },
    ],
  },

  2026: {
    brackets: [
      { bracket_number: 1, min_income: 0, max_income: 237100, base_tax: 0, rate: 18 },
      { bracket_number: 2, min_income: 237101, max_income: 370500, base_tax: 42678, rate: 26 },
      { bracket_number: 3, min_income: 370501, max_income: 512800, base_tax: 77362, rate: 31 },
      { bracket_number: 4, min_income: 512801, max_income: 673000, base_tax: 121475, rate: 36 },
      { bracket_number: 5, min_income: 673001, max_income: 857900, base_tax: 179147, rate: 39 },
      { bracket_number: 6, min_income: 857901, max_income: 1817000, base_tax: 251258, rate: 41 },
      { bracket_number: 7, min_income: 1817001, max_income: null, base_tax: 644489, rate: 45 },
    ],
    rebates: [
      { rebate_type: 'PRIMARY', amount: 17235, age_threshold: 0 },
      { rebate_type: 'SECONDARY', amount: 9444, age_threshold: 65 },
      { rebate_type: 'TERTIARY', amount: 3145, age_threshold: 75 },
    ],
    thresholds: [
      { threshold_type: 'below_65', age_group: 'below_65', amount: 95750 },
      { threshold_type: '65_to_74', age_group: '65_to_74', amount: 148217 },
      { threshold_type: '75_and_over', age_group: '75_and_over', amount: 165689 },
    ],
    medical_tax_credits: {
      main_member: 364,
      first_dependant: 364,
      additional_dependant: 246,
    },
    uif: {
      employee_rate: 1,
      employer_rate: 1,
      ceiling: 17712,
    },
    sdl: {
      rate: 1,
      threshold: 500000,
    },
    prescribed_rates: [
      { description: 'Travel – Reimbursive Rate per km', subtype_index: 'Local', irp5_code: '3702', rate: 4.84 },
      { description: 'S&T Local – Meals and Incidental Costs', subtype_index: 'Local – Meals and Incidental Costs', irp5_code: '3704', rate: 570.00 },
      { description: 'S&T Local – Incidental Costs Only', subtype_index: 'Local – Incidental Costs', irp5_code: '3704', rate: 176.00 },
      { description: 'S&T Foreign – Deemed Allowance', subtype_index: 'Foreign', irp5_code: '3715', rate: 890.00 },
    ],
  },

  2027: {
    brackets: [
      { bracket_number: 1, min_income: 0, max_income: 237100, base_tax: 0, rate: 18 },
      { bracket_number: 2, min_income: 237101, max_income: 370500, base_tax: 42678, rate: 26 },
      { bracket_number: 3, min_income: 370501, max_income: 512800, base_tax: 77362, rate: 31 },
      { bracket_number: 4, min_income: 512801, max_income: 673000, base_tax: 121475, rate: 36 },
      { bracket_number: 5, min_income: 673001, max_income: 857900, base_tax: 179147, rate: 39 },
      { bracket_number: 6, min_income: 857901, max_income: 1817000, base_tax: 251258, rate: 41 },
      { bracket_number: 7, min_income: 1817001, max_income: null, base_tax: 644489, rate: 45 },
    ],
    rebates: [
      { rebate_type: 'PRIMARY', amount: 17235, age_threshold: 0 },
      { rebate_type: 'SECONDARY', amount: 9444, age_threshold: 65 },
      { rebate_type: 'TERTIARY', amount: 3145, age_threshold: 75 },
    ],
    thresholds: [
      { threshold_type: 'below_65', age_group: 'below_65', amount: 95750 },
      { threshold_type: '65_to_74', age_group: '65_to_74', amount: 148217 },
      { threshold_type: '75_and_over', age_group: '75_and_over', amount: 165689 },
    ],
    medical_tax_credits: {
      main_member: 364,
      first_dependant: 364,
      additional_dependant: 246,
    },
    uif: {
      employee_rate: 1,
      employer_rate: 1,
      ceiling: 17712,
    },
    sdl: {
      rate: 1,
      threshold: 500000,
    },
    prescribed_rates: [
      { description: 'Travel – Reimbursive Rate per km', subtype_index: 'Local', irp5_code: '3702', rate: 4.95 },
      { description: 'S&T Local – Meals and Incidental Costs', subtype_index: 'Local – Meals and Incidental Costs', irp5_code: '3704', rate: 595.00 },
      { description: 'S&T Local – Incidental Costs Only', subtype_index: 'Local – Incidental Costs', irp5_code: '3704', rate: 184.00 },
      { description: 'S&T Foreign – Deemed Allowance', subtype_index: 'Foreign', irp5_code: '3715', rate: 925.00 },
    ],
  },
};

module.exports = SARS_TAX_DEFAULTS;
