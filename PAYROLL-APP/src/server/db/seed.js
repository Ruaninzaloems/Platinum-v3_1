const { pool, query } = require('../config/database');

async function seed() {
  console.log('Seeding mSCOA HR & Payroll database...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`INSERT INTO employee_types (code, name, description) VALUES
      ('MUNICIPAL', 'Municipal Staff', 'Municipal staff employees'),
      ('SENIOR_MGMT', 'Senior Management', 'Senior management employees'),
      ('WARD_CLLR', 'Ward Councillors', 'Ward councillors'),
      ('NON_EMP', 'Non-Employees', 'Non-employee personnel'),
      ('POST_RETIRE', 'Post-Retirement', 'Post-retirement personnel'),
      ('BOARD_MEMBER', 'Board Member of Entities', 'Board members of municipal entities')
    ON CONFLICT (code) DO NOTHING`);

    const etRows = (await client.query("SELECT id, code FROM employee_types")).rows;
    const etId = (code) => etRows.find(r => r.code === code)?.id;

    await client.query(`INSERT INTO employee_subtypes (employee_type_id, code, name) VALUES
      ($1, 'FULL_TIME', 'Full Time'),
      ($1, 'PART_TIME', 'Part Time'),
      ($1, 'FIXED_TERM', 'Fixed Term Contract'),
      ($1, 'CASUAL', 'Casual Worker'),
      ($2, 'MM', 'Municipal Manager'),
      ($2, 'CFO', 'Chief Financial Officer'),
      ($2, 'DIR', 'Director'),
      ($3, 'FULL_TIME_CLLR', 'Full-Time Councillor'),
      ($3, 'PART_TIME_CLLR', 'Part-Time Councillor')
    ON CONFLICT (code) DO NOTHING`, [etId('MUNICIPAL'), etId('SENIOR_MGMT'), etId('WARD_CLLR')]);

    await client.query(`INSERT INTO conditions_of_service (id, code, name, start_date, end_date, enabled) VALUES
      (2, 'SALGB', 'Bargaining Council Agreement', '1900-01-01', '9999-12-31', true),
      (3, 'BCoEA', 'Basic Conditions of Employment Act', '1900-01-01', '9999-12-31', true),
      (4, 'CLRS', 'Conditions of Service - Public Office Bearers', '1900-01-01', '9999-12-31', true),
      (5, 'SRMG', 'Conditions of Service - MM & Senior Managers', '1900-01-01', '9999-12-31', true)
    ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, name=EXCLUDED.name, start_date=EXCLUDED.start_date, end_date=EXCLUDED.end_date, enabled=EXCLUDED.enabled`);
    const legacyCosIds = `SELECT id FROM conditions_of_service WHERE code IN ('SALGBC_MAIN', 'TASK_GRADE', 'COUNCILLOR_COS', 'SHIFT_WORKER')`;
    await client.query(`UPDATE employees SET condition_of_service_id = 2 WHERE condition_of_service_id IN (${legacyCosIds})`);
    await client.query(`UPDATE job_profiles SET condition_of_service_id = 2 WHERE condition_of_service_id IN (${legacyCosIds})`);
    await client.query(`UPDATE positions SET condition_of_service_id = 2 WHERE condition_of_service_id IN (${legacyCosIds})`);
    await client.query(`UPDATE leave_schemes SET condition_of_service_id = 2 WHERE condition_of_service_id IN (${legacyCosIds})`);
    await client.query(`DELETE FROM conditions_of_service WHERE code IN ('SALGBC_MAIN', 'TASK_GRADE', 'COUNCILLOR_COS', 'SHIFT_WORKER')`);
    await client.query(`SELECT setval('conditions_of_service_id_seq', COALESCE((SELECT MAX(id) FROM conditions_of_service), 1))`);

    await client.query(`INSERT INTO departments (code, name, scoa_function_id) VALUES
      ('OTM', 'Office of the Municipal Manager', 'FUNC001'),
      ('FIN', 'Budget & Treasury Office', 'FUNC002'),
      ('CORP', 'Corporate Services', 'FUNC003'),
      ('TECH', 'Technical Services', 'FUNC004'),
      ('COMM', 'Community Services', 'FUNC005'),
      ('DEV', 'Development Planning', 'FUNC006'),
      ('PHS', 'Public Health & Safety', 'FUNC007'),
      ('ELEC', 'Electrical Services', 'FUNC008')
    ON CONFLICT (code) DO NOTHING`);

    await client.query(`INSERT INTO divisions (department_id, code, name) VALUES
      (1, 'OTM-IDP', 'IDP & Strategic Planning'),
      (1, 'OTM-IA', 'Internal Audit'),
      (1, 'OTM-COMMS', 'Communications'),
      (2, 'FIN-REV', 'Revenue Management'),
      (2, 'FIN-EXP', 'Expenditure Management'),
      (2, 'FIN-SCM', 'Supply Chain Management'),
      (2, 'FIN-FIN', 'Financial Reporting'),
      (3, 'CORP-HR', 'Human Resources'),
      (3, 'CORP-IT', 'Information Technology'),
      (3, 'CORP-ADMIN', 'Administration'),
      (3, 'CORP-LEGAL', 'Legal Services'),
      (4, 'TECH-ROAD', 'Roads & Stormwater'),
      (4, 'TECH-PMU', 'Project Management Unit'),
      (4, 'TECH-MAINT', 'Building Maintenance'),
      (5, 'COMM-LIB', 'Libraries'),
      (5, 'COMM-SPORT', 'Sports & Recreation'),
      (5, 'COMM-PARKS', 'Parks & Cemeteries'),
      (6, 'DEV-PLAN', 'Town Planning'),
      (6, 'DEV-BUILD', 'Building Control'),
      (7, 'PHS-FIRE', 'Fire & Rescue'),
      (7, 'PHS-TRAFFIC', 'Traffic & Licensing'),
      (7, 'PHS-ENV', 'Environmental Health'),
      (8, 'ELEC-DIST', 'Electrical Distribution'),
      (8, 'ELEC-MAINT', 'Electrical Maintenance')
    ON CONFLICT (code) DO NOTHING`);

    await client.query(`INSERT INTO task_grades (grade_code, grade_name, min_salary, max_salary, notch_count, start_date) VALUES
      ('T01', 'TASK Grade 1', 120000, 160000, 5, '2024-07-01'),
      ('T02', 'TASK Grade 2', 140000, 185000, 5, '2024-07-01'),
      ('T03', 'TASK Grade 3', 155000, 210000, 5, '2024-07-01'),
      ('T04', 'TASK Grade 4', 175000, 240000, 5, '2024-07-01'),
      ('T05', 'TASK Grade 5', 195000, 275000, 5, '2024-07-01'),
      ('T06', 'TASK Grade 6', 220000, 310000, 5, '2024-07-01'),
      ('T07', 'TASK Grade 7', 250000, 360000, 5, '2024-07-01'),
      ('T08', 'TASK Grade 8', 290000, 420000, 5, '2024-07-01'),
      ('T09', 'TASK Grade 9', 340000, 490000, 5, '2024-07-01'),
      ('T10', 'TASK Grade 10', 400000, 580000, 5, '2024-07-01'),
      ('T11', 'TASK Grade 11', 470000, 680000, 5, '2024-07-01'),
      ('T12', 'TASK Grade 12', 550000, 800000, 5, '2024-07-01'),
      ('T13', 'TASK Grade 13', 650000, 950000, 5, '2024-07-01'),
      ('T14', 'TASK Grade 14', 780000, 1100000, 5, '2024-07-01'),
      ('T15', 'TASK Grade 15', 900000, 1350000, 5, '2024-07-01'),
      ('T16', 'TASK Grade 16', 1050000, 1600000, 5, '2024-07-01'),
      ('T17', 'TASK Grade 17', 1250000, 1900000, 5, '2024-07-01'),
      ('T18', 'TASK Grade 18', 1500000, 2300000, 5, '2024-07-01'),
      ('T19', 'TASK Grade 19 (MM)', 2000000, 3000000, 5, '2024-07-01')
    ON CONFLICT DO NOTHING`);

    const grades = await client.query('SELECT id, min_salary, max_salary FROM task_grades ORDER BY id');
    for (const g of grades.rows) {
      const range = parseFloat(g.max_salary) - parseFloat(g.min_salary);
      for (let n = 1; n <= 5; n++) {
        const salary = parseFloat(g.min_salary) + (range * (n - 1) / 4);
        await client.query(
          `INSERT INTO task_grade_notches (task_grade_id, notch_number, min_salary, max_salary, start_date)
           VALUES ($1, $2, $3, $4, '2024-07-01') ON CONFLICT DO NOTHING`,
          [g.id, n, salary.toFixed(2), (salary * 1.05).toFixed(2)]
        );
      }
    }

    await client.query(`INSERT INTO job_profiles (job_title, ofo_code, occupation, job_purpose) VALUES
      ('Municipal Manager', '111101', 'Chief Executive', 'Head of administration and accounting officer of the municipality'),
      ('Chief Financial Officer', '121101', 'Finance Manager', 'Responsible for all financial management functions'),
      ('Director: Corporate Services', '121301', 'HR Director', 'Oversee HR, IT, administration, and legal services'),
      ('Director: Technical Services', '132101', 'Engineering Director', 'Manage infrastructure and technical operations'),
      ('Director: Community Services', '134901', 'Community Services Director', 'Manage community-facing services'),
      ('Manager: Human Resources', '121301', 'HR Manager', 'Manage HR operations including recruitment, payroll, and compliance'),
      ('Manager: Finance', '121101', 'Finance Manager', 'Financial operations, reporting, and compliance'),
      ('Manager: IT', '133101', 'IT Manager', 'Information technology infrastructure and systems'),
      ('Senior Accountant', '241101', 'Accountant', 'Financial accounting and reporting'),
      ('HR Officer', '242301', 'HR Officer', 'HR administration and employee services'),
      ('Payroll Administrator', '441501', 'Payroll Clerk', 'Payroll processing and tax compliance'),
      ('General Worker', '911201', 'General Worker', 'General maintenance and manual labour'),
      ('Firefighter', '541101', 'Firefighter', 'Fire and rescue services'),
      ('Traffic Officer', '335201', 'Traffic Officer', 'Traffic law enforcement'),
      ('Librarian', '262101', 'Librarian', 'Library and information services'),
      ('Town Planner', '216101', 'Town Planner', 'Urban and regional planning'),
      ('Civil Engineer', '214201', 'Civil Engineer', 'Infrastructure design and maintenance'),
      ('Electrician', '741201', 'Electrician', 'Electrical installation and maintenance'),
      ('Admin Clerk', '441901', 'Clerk', 'Administrative and clerical support'),
      ('SCM Officer', '332301', 'Procurement Officer', 'Supply chain and procurement')
    ON CONFLICT DO NOTHING`);

    const deptIds = await client.query('SELECT id, code FROM departments ORDER BY id');
    const deptMap = {};
    for (const d of deptIds.rows) deptMap[d.code] = d.id;

    const divIds = await client.query('SELECT id, code FROM divisions ORDER BY id');
    const divMap = {};
    for (const d of divIds.rows) divMap[d.code] = d.id;

    const jpIds = await client.query('SELECT id, job_title FROM job_profiles ORDER BY id');
    const jpMap = {};
    for (const j of jpIds.rows) jpMap[j.job_title] = j.id;

    const tgIds = await client.query('SELECT id, grade_code FROM task_grades ORDER BY id');
    const tgMap = {};
    for (const t of tgIds.rows) tgMap[t.grade_code] = t.id;

    const positions = [
      ['POS001', 'Municipal Manager', 'OTM', null, 'Municipal Manager', 'T19', 5, true, null],
      ['POS002', 'Chief Financial Officer', 'FIN', null, 'Chief Financial Officer', 'T18', 5, true, 'POS001'],
      ['POS003', 'Director: Corporate Services', 'CORP', null, 'Director: Corporate Services', 'T17', 5, true, 'POS001'],
      ['POS004', 'Director: Technical Services', 'TECH', null, 'Director: Technical Services', 'T17', 5, true, 'POS001'],
      ['POS005', 'Director: Community Services', 'COMM', null, 'Director: Community Services', 'T17', 5, true, 'POS001'],
      ['POS006', 'Manager: Human Resources', 'CORP', 'CORP-HR', 'Manager: Human Resources', 'T14', 1, false, 'POS003'],
      ['POS007', 'Manager: Finance', 'FIN', 'FIN-FIN', 'Manager: Finance', 'T14', 1, false, 'POS002'],
      ['POS008', 'Manager: IT', 'CORP', 'CORP-IT', 'Manager: IT', 'T13', 1, false, 'POS003'],
      ['POS009', 'Senior Accountant', 'FIN', 'FIN-FIN', 'Senior Accountant', 'T11', 1, false, 'POS007'],
      ['POS010', 'HR Officer', 'CORP', 'CORP-HR', 'HR Officer', 'T09', 1, false, 'POS006'],
      ['POS011', 'Payroll Administrator', 'CORP', 'CORP-HR', 'Payroll Administrator', 'T08', 1, false, 'POS006'],
      ['POS012', 'Admin Clerk - HR', 'CORP', 'CORP-HR', 'Admin Clerk', 'T05', 1, false, 'POS010'],
      ['POS013', 'Admin Clerk - Finance', 'FIN', 'FIN-REV', 'Admin Clerk', 'T05', 1, false, 'POS007'],
      ['POS014', 'SCM Officer', 'FIN', 'FIN-SCM', 'SCM Officer', 'T09', 1, false, 'POS007'],
      ['POS015', 'Town Planner', 'DEV', 'DEV-PLAN', 'Town Planner', 'T12', 1, false, 'POS001'],
      ['POS016', 'Civil Engineer', 'TECH', 'TECH-ROAD', 'Civil Engineer', 'T13', 1, false, 'POS004'],
      ['POS017', 'Firefighter 1', 'PHS', 'PHS-FIRE', 'Firefighter', 'T06', 1, false, 'POS001'],
      ['POS018', 'Firefighter 2', 'PHS', 'PHS-FIRE', 'Firefighter', 'T06', 1, false, 'POS001'],
      ['POS019', 'Traffic Officer', 'PHS', 'PHS-TRAFFIC', 'Traffic Officer', 'T08', 1, false, 'POS001'],
      ['POS020', 'Librarian', 'COMM', 'COMM-LIB', 'Librarian', 'T08', 1, false, 'POS005'],
      ['POS021', 'Electrician 1', 'ELEC', 'ELEC-DIST', 'Electrician', 'T07', 1, false, 'POS001'],
      ['POS022', 'Electrician 2', 'ELEC', 'ELEC-MAINT', 'Electrician', 'T07', 1, false, 'POS001'],
      ['POS023', 'General Worker 1', 'COMM', 'COMM-PARKS', 'General Worker', 'T02', 1, false, 'POS005'],
      ['POS024', 'General Worker 2', 'COMM', 'COMM-PARKS', 'General Worker', 'T02', 1, false, 'POS005'],
      ['POS025', 'General Worker 3', 'TECH', 'TECH-MAINT', 'General Worker', 'T02', 1, false, 'POS004'],
    ];

    const posIdMap = {};
    for (const p of positions) {
      const parentPosId = p[8] ? posIdMap[p[8]] : null;
      const r = await client.query(
        `INSERT INTO positions (position_code, title, department_id, division_id, job_profile_id, task_grade_id, employee_type_id, is_hod, parent_position_id, status, funded, start_date, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'VACANT', TRUE, '2024-07-01', 1, 1)
         ON CONFLICT (position_code) DO UPDATE SET title = EXCLUDED.title RETURNING id`,
        [p[0], p[1], deptMap[p[2]], p[3] ? divMap[p[3]] : null, jpMap[p[4]], tgMap[p[5]], p[6], p[7], parentPosId]
      );
      posIdMap[p[0]] = r.rows[0].id;
    }

    const employees = [
      ['EMP001','9001015800085','Mr','TM','Thabo','Michael','Molefe','Thabo','1990-01-01','Male','Sesotho','Married',2,'thabo.molefe@municipality.gov.za','0821234567','2015-03-01','POS001','T19',5,2800000,'9001015800085','South African'],
      ['EMP002','8506235800081','Ms','NP','Nomvula','Patience','Dlamini','Nomvula','1985-06-23','Female','isiZulu','Single',0,'nomvula.dlamini@municipality.gov.za','0839876543','2016-07-15','POS002','T18',4,2100000,'8506235800081','South African'],
      ['EMP003','8812105800089','Mr','JD','Johan','Daniel','van der Merwe','Johan','1988-12-10','Male','Afrikaans','Married',3,'johan.vdmerwe@municipality.gov.za','0827654321','2017-01-10','POS003','T17',3,1700000,'8812105800089','South African'],
      ['EMP004','7903155800082','Mr','SM','Sipho','Moses','Nkosi','Sipho','1979-03-15','Male','isiZulu','Married',2,'sipho.nkosi@municipality.gov.za','0831112233','2014-06-01','POS004','T17',4,1800000,'7903155800082','South African'],
      ['EMP005','9205215800086','Ms','LT','Lerato','Thandeka','Motaung','Lerato','1992-05-21','Female','Sesotho','Single',1,'lerato.motaung@municipality.gov.za','0824445566','2018-09-01','POS005','T17',2,1550000,'9205215800086','South African'],
      ['EMP006','8708015800083','Ms','AK','Ayanda','Khosi','Mthembu','Ayanda','1987-08-01','Female','isiZulu','Married',1,'ayanda.mthembu@municipality.gov.za','0835556677','2019-02-01','POS006','T14',3,950000,'8708015800083','South African'],
      ['EMP007','8402285800087','Mr','PJ','Pieter','Jan','Botha','Pieter','1984-02-28','Male','Afrikaans','Married',2,'pieter.botha@municipality.gov.za','0826667788','2016-04-01','POS007','T14',4,1000000,'8402285800087','South African'],
      ['EMP008','9107135800084','Mr','KN','Kagiso','Nhlanhla','Mabaso','Kagiso','1991-07-13','Male','Setswana','Single',0,'kagiso.mabaso@municipality.gov.za','0837778899','2020-01-15','POS008','T13',2,720000,'9107135800084','South African'],
      ['EMP009','8610225800088','Ms','FM','Fatima','Maria','Abrahams','Fatima','1986-10-22','Female','English','Married',1,'fatima.abrahams@municipality.gov.za','0828889900','2017-05-01','POS009','T11',3,600000,'8610225800088','South African'],
      ['EMP010','9311025800085','Ms','ZN','Zanele','Nontobeko','Khumalo','Zanele','1993-11-02','Female','isiZulu','Single',0,'zanele.khumalo@municipality.gov.za','0829990011','2021-03-01','POS010','T09',2,420000,'9311025800085','South African'],
      ['EMP011','9508185800082','Mr','BM','Bongani','Mandla','Sithole','Bongani','1995-08-18','Male','isiZulu','Single',0,'bongani.sithole@municipality.gov.za','0830011223','2022-01-10','POS011','T08',1,290000,'9508185800082','South African'],
      ['EMP012','9704065800089','Ms','TN','Thandi','Nolwazi','Ngcobo','Thandi','1997-04-06','Female','isiZulu','Single',0,'thandi.ngcobo@municipality.gov.za','0831122334','2023-04-01','POS012','T05',1,195000,'9704065800089','South African'],
      ['EMP013','9601125800086','Mr','MC','Mpho','Charles','Mokoena','Mpho','1996-01-12','Male','Sesotho','Single',0,'mpho.mokoena@municipality.gov.za','0832233445','2022-07-01','POS013','T05',1,195000,'9601125800086','South African'],
      ['EMP014','8809305800083','Ms','RJ','Refilwe','Joyce','Tau','Refilwe','1988-09-30','Female','Setswana','Married',1,'refilwe.tau@municipality.gov.za','0833344556','2019-08-01','POS014','T09',3,460000,'8809305800083','South African'],
      ['EMP015','9003175800087','Mr','DN','David','Nkosinathi','Zulu','David','1990-03-17','Male','isiZulu','Married',2,'david.zulu@municipality.gov.za','0834455667','2018-06-01','POS015','T12',2,600000,'9003175800087','South African'],
      ['EMP016','8511085800084','Mr','WJ','Willem','Johannes','Pretorius','Willem','1985-11-08','Male','Afrikaans','Married',3,'willem.pretorius@municipality.gov.za','0835566778','2015-09-01','POS016','T13',4,850000,'8511085800084','South African'],
      ['EMP017','9206225800088','Mr','TL','Tshepo','Lucky','Maseko','Tshepo','1992-06-22','Male','Sepedi','Single',0,'tshepo.maseko@municipality.gov.za','0836677889','2020-04-01','POS017','T06',2,260000,'9206225800088','South African'],
      ['EMP018','9409105800085','Mr','NR','Nhlanhla','Robert','Mkhize','Nhlanhla','1994-09-10','Male','isiZulu','Single',0,'nhlanhla.mkhize@municipality.gov.za','0837788990','2021-08-01','POS018','T06',1,220000,'9409105800085','South African'],
      ['EMP019','8707035800082','Ms','PS','Puleng','Sarah','Moloi','Puleng','1987-07-03','Female','Sesotho','Married',1,'puleng.moloi@municipality.gov.za','0838899001','2016-11-01','POS019','T08',3,370000,'8707035800082','South African'],
      ['EMP020','9112295800089','Ms','CM','Cynthia','Michelle','Naidoo','Cynthia','1991-12-29','Female','English','Single',0,'cynthia.naidoo@municipality.gov.za','0839900112','2022-03-01','POS020','T08',2,330000,'9112295800089','South African'],
      ['EMP021','8905155800086','Mr','MS','Mandla','Samuel','Dube','Mandla','1989-05-15','Male','isiZulu','Married',2,'mandla.dube@municipality.gov.za','0830011224','2017-10-01','POS021','T07',3,330000,'8905155800086','South African'],
      ['EMP022','9307085800083','Mr','AT','Andile','Thulani','Zwane','Andile','1993-07-08','Male','isiZulu','Single',0,'andile.zwane@municipality.gov.za','0831122335','2021-06-01','POS022','T07',1,250000,'9307085800083','South African'],
      ['EMP023','7802125800087','Mr','GJ','Gift','Joseph','Mahlangu','Gift','1978-02-12','Male','isiNdebele','Married',4,'gift.mahlangu@municipality.gov.za','0832233446','2010-03-01','POS023','T02',5,160000,'7802125800087','South African'],
      ['EMP024','8501045800084','Ms','BN','Busisiwe','Nompilo','Ndlovu','Busisiwe','1985-01-04','Female','isiZulu','Married',2,'busisiwe.ndlovu@municipality.gov.za','0833344557','2013-07-01','POS024','T02',4,155000,'8501045800084','South African'],
      ['EMP025','9608205800088','Mr','EM','Emmanuel','Mvuyo','Mzimela','Emmanuel','1996-08-20','Male','isiZulu','Single',0,'emmanuel.mzimela@municipality.gov.za','0834455668','2023-01-15','POS025','T02',1,140000,'9608205800088','South African'],
    ];

    for (const e of employees) {
      const notchResult = await client.query(
        `SELECT min_salary FROM task_grade_notches WHERE task_grade_id = $1 AND notch_number = $2 LIMIT 1`,
        [tgMap[e[17]], e[18]]
      );
      const salary = notchResult.rows.length > 0 ? notchResult.rows[0].min_salary : e[19];

      await client.query(
        `INSERT INTO employees (
          employee_code, id_number, title, initials, first_name, second_name, surname, known_as,
          date_of_birth, gender, language, marital_status, dependants, email_address, cell_number,
          joining_date, position_id, task_grade_id, current_notch, annual_salary,
          income_tax_number, nationality, employee_type_id, condition_of_service_id, status,
          payment_type, created_by, updated_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,1,2,'ACTIVE','EFT',1,1)
        ON CONFLICT (employee_code) DO NOTHING`,
        [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15],
         posIdMap[e[16]], tgMap[e[17]], e[18], salary, e[20], e[21]]
      );

      await client.query(`UPDATE positions SET status = 'FILLED' WHERE position_code = $1`, [e[16]]);
    }

    await client.query(`INSERT INTO salary_heads (code, name, transaction_type, calculation_method, irp5_code, taxable, show_on_payslip, priority, start_date, is_system, created_by, updated_by) VALUES
      ('BASIC', 'Basic Salary', 'EARNING', 'SYSTEM_CALCULATE', '3601', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('BONUS', 'Bonus', 'EARNING', 'SYSTEM_CALCULATE', '3605', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PAYE', 'Pay-as-you-earn (PAYE)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4102', FALSE, TRUE, 1, '1900-01-01', TRUE, 1, 1),
      ('PAYE_BONUS', 'Pay-as-you-earn (PAYE: Bonus)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4102', FALSE, TRUE, 1, '1900-01-01', TRUE, 1, 1),
      ('PAYE_TAX_OVER', 'Pay-as-you-earn (PAYE: Tax Over Deduction)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4102', FALSE, TRUE, 1, '1900-01-01', TRUE, 1, 1),
      ('SDL', 'Skills Development Levy (SDL)', 'COMPANY_CONTRIBUTION', 'SYSTEM_CALCULATE', '4142', FALSE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('UIF_EE', 'Unemployment Insurance Fund (UIF) (Employee)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4141', FALSE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('UIF_ER', 'Unemployment Insurance Fund (UIF) (Employer)', 'COMPANY_CONTRIBUTION', 'SYSTEM_CALCULATE', '4141', FALSE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('UNION_FEES', 'Union Fees', 'DEDUCTION', 'SYSTEM_CALCULATE', NULL, FALSE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('OT_1_5', 'Overtime @ 1.5', 'EARNING', 'SYSTEM_CALCULATE', '3607', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('OT_2_0', 'Overtime @ 2.0', 'EARNING', 'SYSTEM_CALCULATE', '3607', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('MED_EE', 'Medical Aid (Employee)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4005', TRUE, TRUE, 1, '1900-01-01', TRUE, 1, 1),
      ('MED_ER', 'Medical Aid (Employer)', 'COMPANY_CONTRIBUTION', 'SYSTEM_CALCULATE', '4474', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('MED_FRINGE', 'Medical Aid (Fringe)', 'FRINGE_BENEFIT', 'SYSTEM_CALCULATE', '3810', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PEN_EE', 'Pension Fund (Employee)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4001', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PEN_ER', 'Pension Fund (Employer)', 'COMPANY_CONTRIBUTION', 'SYSTEM_CALCULATE', '4472', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PEN_FRINGE', 'Pension Fund (Fringe)', 'FRINGE_BENEFIT', 'SYSTEM_CALCULATE', '3817', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PROV_EE', 'Provident Fund (Employee)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4003', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PROV_ER', 'Provident Fund (Employer)', 'COMPANY_CONTRIBUTION', 'SYSTEM_CALCULATE', '4473', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PROV_FRINGE', 'Provident Fund (Fringe)', 'FRINGE_BENEFIT', 'SYSTEM_CALCULATE', '3825', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('RET_EE', 'Retirement Fund (Employee)', 'DEDUCTION', 'SYSTEM_CALCULATE', '4006', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('RET_FRINGE', 'Retirement Fund (Fringe)', 'FRINGE_BENEFIT', 'SYSTEM_CALCULATE', '3828', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('RET_ER', 'Retirement Fund (Employer)', 'COMPANY_CONTRIBUTION', 'SYSTEM_CALCULATE', '4475', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('TRAVEL_ALLOW', 'Travelling Allowance', 'EARNING', 'USER_INPUT', '3701', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('ACTING_ALLOW', 'Acting Allowance', 'EARNING', 'USER_INPUT', '3713', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('STANDBY_ALLOW', 'Standby Allowance', 'EARNING', 'SYSTEM_CALCULATE', '3713', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('CELL_COUNC', 'Cellphone Allowance - Councillors', 'EARNING', 'USER_INPUT', '3713', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('LONG_SERVICE', 'Longservice Bonus', 'EARNING', 'SYSTEM_CALCULATE', '3605', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('PERF_BONUS', 'Performance Bonus', 'EARNING', 'USER_INPUT', '3605', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('BARG_EE', 'Bargaining Council Levy (Employee)', 'DEDUCTION', 'SYSTEM_CALCULATE', NULL, FALSE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('BARG_ER', 'Bargaining Council Levy (Employer)', 'COMPANY_CONTRIBUTION', 'SYSTEM_CALCULATE', '4584', FALSE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('HOUSING_GAP', 'Housing GAP Market Allowance', 'EARNING', 'SYSTEM_CALCULATE', '3713', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('BACKPAY_BASIC', 'Backpay - Basic', 'EARNING', 'USER_INPUT', '3601', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1),
      ('BACKPAY_BONUS', 'Backpay Bonus', 'EARNING', 'USER_INPUT', '3605', TRUE, TRUE, 2, '1900-01-01', TRUE, 1, 1)
    ON CONFLICT (code) DO NOTHING`);

    const shIds = await client.query('SELECT id, code FROM salary_heads ORDER BY id');
    const shMap = {};
    for (const s of shIds.rows) shMap[s.code] = s.id;

    const empIds = await client.query('SELECT id, employee_code, annual_salary FROM employees WHERE status = $1 ORDER BY id', ['ACTIVE']);
    for (const emp of empIds.rows) {
      const monthly = parseFloat(emp.annual_salary) / 12;
      await client.query(
        `UPDATE employees SET monthly_salary = $1 WHERE id = $2`,
        [monthly.toFixed(2), emp.id]
      );
      await client.query(
        `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, created_by, updated_by)
         VALUES ($1, $2, '2024-03-01', 1, 1) ON CONFLICT DO NOTHING`,
        [emp.id, shMap['BASIC']]
      );
      if (monthly > 20000 && shMap['HOUSING_GAP']) {
        const estRes = await client.query(
          `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, created_by, updated_by)
           VALUES ($1, $2, '2024-03-01', 1, 1) ON CONFLICT DO NOTHING RETURNING id`,
          [emp.id, shMap['HOUSING_GAP']]
        );
        if (estRes.rows.length > 0) {
          await client.query(
            `INSERT INTO employee_payslip_transactions (employee_salary_transaction_id, employee_id, salary_head_id, captured_amount, entry_date, every_month)
             VALUES ($1, $2, $3, $4, '2024-03-01', true)`,
            [estRes.rows[0].id, emp.id, shMap['HOUSING_GAP'], Math.min(monthly * 0.08, 5000).toFixed(2)]
          );
        }
      }

      const systemHeads = ['PEN_EE', 'PEN_ER', 'MED_EE', 'MED_ER'];
      for (const code of systemHeads) {
        if (shMap[code]) {
          await client.query(
            `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, created_by, updated_by)
             VALUES ($1, $2, '2024-03-01', 1, 1) ON CONFLICT DO NOTHING`,
            [emp.id, shMap[code]]
          );
        }
      }
      if (shMap['CELL_COUNC'] && monthly >= 30000) {
        const estRes = await client.query(
          `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, created_by, updated_by)
           VALUES ($1, $2, '2024-03-01', 1, 1) ON CONFLICT DO NOTHING RETURNING id`,
          [emp.id, shMap['CELL_COUNC']]
        );
        if (estRes.rows.length > 0) {
          await client.query(
            `INSERT INTO employee_payslip_transactions (employee_salary_transaction_id, employee_id, salary_head_id, captured_amount, entry_date, every_month)
             VALUES ($1, $2, $3, $4, '2024-03-01', true)`,
            [estRes.rows[0].id, emp.id, shMap['CELL_COUNC'], 1200]
          );
        }
      }
      if (shMap['UNION_FEES'] && monthly < 50000) {
        await client.query(
          `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, start_date, created_by, updated_by)
           VALUES ($1, $2, '2024-03-01', 1, 1) ON CONFLICT DO NOTHING`,
          [emp.id, shMap['UNION_FEES']]
        );
      }
    }

    await client.query(`INSERT INTO payroll_cycles (code, name, cycle_type, periods_per_year) VALUES
      ('MONTHLY_STAFF', 'Monthly - Municipal Staff', 'MONTHLY', 12),
      ('MONTHLY_SENIOR', 'Monthly - Senior Management', 'MONTHLY', 12),
      ('MONTHLY_CLLR', 'Monthly - Ward Councillors', 'MONTHLY', 12),
      ('WEEKLY_STAFF', 'Weekly - Municipal Staff', 'WEEKLY', 52)
    ON CONFLICT (code) DO NOTHING`);

    const allCycles = (await client.query("SELECT id FROM payroll_cycles ORDER BY id")).rows;

    for (const cycle of allCycles) {
      for (let p = 1; p <= 12; p++) {
        const taxPeriod = p >= 3 ? p - 2 : p + 10;
        const taxYear = p >= 3 ? 2026 : 2025;
        const startDate = `2025-${String(p).padStart(2, '0')}-01`;
        const endDay = new Date(2025, p, 0).getDate();
        const endDate = `2025-${String(p).padStart(2, '0')}-${endDay}`;
        const paymentDate = `2025-${String(p).padStart(2, '0')}-25`;
        const status = p <= 2 ? 'CLOSED' : 'OPEN';

        await client.query(
          `INSERT INTO payroll_periods (cycle_id, period_number, tax_year, tax_period, financial_year, financial_period, start_date, end_date, payment_date, status)
           VALUES ($1, $2, $3, $4, '2024/2025', $2, $5, $6, $7, $8)
           ON CONFLICT (cycle_id, period_number, tax_year) DO NOTHING`,
          [cycle.id, p, taxYear, taxPeriod, startDate, endDate, paymentDate, status]
        );
      }

      for (let p = 1; p <= 12; p++) {
        const taxPeriod = p >= 3 ? p - 2 : p + 10;
        const taxYear = p >= 3 ? 2027 : 2026;
        const startDate = `2026-${String(p).padStart(2, '0')}-01`;
        const endDay = new Date(2026, p, 0).getDate();
        const endDate = `2026-${String(p).padStart(2, '0')}-${endDay}`;
        const paymentDate = `2026-${String(p).padStart(2, '0')}-25`;
        const status = p <= 2 ? 'CLOSED' : 'OPEN';

        await client.query(
          `INSERT INTO payroll_periods (cycle_id, period_number, tax_year, tax_period, financial_year, financial_period, start_date, end_date, payment_date, status)
           VALUES ($1, $2, $3, $4, '2025/2026', $2, $5, $6, $7, $8)
           ON CONFLICT (cycle_id, period_number, tax_year) DO NOTHING`,
          [cycle.id, p, taxYear, taxPeriod, startDate, endDate, paymentDate, status]
        );
      }
    }

    await client.query(`INSERT INTO leave_schemes (code, name, employee_type_id, start_date) VALUES
      ('STAFF_LEAVE', 'Municipal Staff Leave Scheme', $1, '2024-01-01'),
      ('SENIOR_LEAVE', 'Senior Management Leave Scheme', $2, '2024-01-01'),
      ('CLLR_LEAVE', 'Ward Councillor Leave Scheme', $3, '2024-01-01')
    ON CONFLICT (code) DO NOTHING`, [etId('MUNICIPAL'), etId('SENIOR_MGMT'), etId('WARD_CLLR')]);

    const lsId = (await client.query("SELECT id FROM leave_schemes WHERE code = 'STAFF_LEAVE' LIMIT 1")).rows[0].id;

    await client.query(`INSERT INTO leave_types (code, name, leave_scheme_id, accrual_days, accrual_frequency, max_accumulation, carry_over_days, paid) VALUES
      ('ANNUAL', 'Annual Leave', $1, 21, 'ANNUAL', 48, 18, TRUE),
      ('SICK', 'Sick Leave', $1, 36, 'ANNUAL', 36, 0, TRUE),
      ('FAMILY', 'Family Responsibility Leave', $1, 5, 'ANNUAL', 5, 0, TRUE),
      ('MATERNITY', 'Maternity Leave', $1, 120, 'ONCE_OFF', 120, 0, TRUE),
      ('PATERNITY', 'Paternity Leave', $1, 10, 'ONCE_OFF', 10, 0, TRUE),
      ('STUDY', 'Study Leave', $1, 10, 'ANNUAL', 10, 0, TRUE),
      ('SPECIAL', 'Special Leave', $1, 0, 'ONCE_OFF', 0, 0, TRUE),
      ('UNPAID', 'Unpaid Leave', $1, 0, 'ONCE_OFF', 0, 0, FALSE)
    ON CONFLICT (code) DO NOTHING`, [lsId]);

    await client.query(`INSERT INTO holidays (name, holiday_date, recurring) VALUES
      ('New Year''s Day', '2025-01-01', TRUE),
      ('Human Rights Day', '2025-03-21', TRUE),
      ('Good Friday', '2025-04-18', FALSE),
      ('Family Day', '2025-04-21', FALSE),
      ('Freedom Day', '2025-04-27', TRUE),
      ('Workers'' Day', '2025-05-01', TRUE),
      ('Youth Day', '2025-06-16', TRUE),
      ('National Women''s Day', '2025-08-09', TRUE),
      ('Heritage Day', '2025-09-24', TRUE),
      ('Day of Reconciliation', '2025-12-16', TRUE),
      ('Christmas Day', '2025-12-25', TRUE),
      ('Day of Goodwill', '2025-12-26', TRUE)
    ON CONFLICT (name, holiday_date) DO NOTHING`);

    const ltIds = await client.query('SELECT id, code FROM leave_types ORDER BY id');
    const ltMap = {};
    for (const l of ltIds.rows) ltMap[l.code] = l.id;

    for (const emp of empIds.rows) {
      await client.query(
        `INSERT INTO employee_leave_balances (employee_id, leave_type_id, balance_days, accrued_days, taken_days, as_at_date)
         VALUES ($1, $2, $3, 21, $4, CURRENT_DATE) ON CONFLICT DO NOTHING`,
        [emp.id, ltMap['ANNUAL'], 15 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 8)]
      );
      await client.query(
        `INSERT INTO employee_leave_balances (employee_id, leave_type_id, balance_days, accrued_days, taken_days, as_at_date)
         VALUES ($1, $2, $3, 36, $4, CURRENT_DATE) ON CONFLICT DO NOTHING`,
        [emp.id, ltMap['SICK'], 30 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 5)]
      );
    }

    const leaveStatuses = ['PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'REJECTED'];
    for (let i = 0; i < 15; i++) {
      const empIdx = Math.floor(Math.random() * empIds.rows.length);
      const startDay = Math.floor(Math.random() * 28) + 1;
      const days = Math.floor(Math.random() * 5) + 1;
      const month = Math.floor(Math.random() * 3) + 1;
      const statusIdx = Math.floor(Math.random() * leaveStatuses.length);
      await client.query(
        `INSERT INTO leave_transactions (employee_id, leave_type_id, start_date, end_date, days, status, reason, captured_by)
         VALUES ($1, $2, $3, $4, $5, $6, 'Personal leave request', 1)`,
        [empIds.rows[empIdx].id, ltMap['ANNUAL'],
         `2025-${String(month).padStart(2,'0')}-${String(startDay).padStart(2,'0')}`,
         `2025-${String(month).padStart(2,'0')}-${String(Math.min(startDay + days, 28)).padStart(2,'0')}`,
         days, leaveStatuses[statusIdx]]
      );
    }

    await client.query(`INSERT INTO medical_aid_schemes (code, name, scheme_type, main_member_contribution, adult_dependant_contribution, child_dependant_contribution, employer_contribution, start_date) VALUES
      ('BONITAS', 'Bonitas Medical Fund', 'BonFit Select', 2150, 1850, 650, 2150, '2024-01-01'),
      ('GEMS', 'Government Employees Medical Scheme', 'Emerald Value', 1980, 1650, 580, 1980, '2024-01-01'),
      ('DISCOVERY', 'Discovery Health', 'Smart Plan', 2450, 2100, 720, 2450, '2024-01-01'),
      ('MOMENTUM', 'Momentum Health', 'Ingwe', 1850, 1500, 550, 1850, '2024-01-01')
    ON CONFLICT DO NOTHING`);

    await client.query(`INSERT INTO retirement_fund_types (code, name, fund_type, fund_administrator, employee_contribution_rate, employer_contribution_rate, start_date) VALUES
      ('SALA_PF', 'SALA Pension Fund', 'PENSION', 'SALA Administrators', 7.50, 13.00, '2024-01-01'),
      ('SAMWU_PF', 'SAMWU National Provident Fund', 'PROVIDENT', 'SAMWU Administrators', 6.00, 12.00, '2024-01-01'),
      ('CAPE_JT', 'Cape Joint Pension Fund', 'PENSION', 'Cape Joint Admin', 7.50, 13.50, '2024-01-01')
    ON CONFLICT (code) DO NOTHING`);

    await client.query(`INSERT INTO tax_brackets (tax_year, bracket_number, min_income, max_income, base_tax, rate, start_date) VALUES
      (2026, 1, 0, 237100, 0, 18.00, '2025-03-01'),
      (2026, 2, 237101, 370500, 42678, 26.00, '2025-03-01'),
      (2026, 3, 370501, 512800, 77362, 31.00, '2025-03-01'),
      (2026, 4, 512801, 673000, 121475, 36.00, '2025-03-01'),
      (2026, 5, 673001, 857900, 179147, 39.00, '2025-03-01'),
      (2026, 6, 857901, 1817000, 251258, 41.00, '2025-03-01'),
      (2026, 7, 1817001, 999999999, 644489, 45.00, '2025-03-01')
    ON CONFLICT (tax_year, bracket_number) DO NOTHING`);

    await client.query(`INSERT INTO tax_rebates (tax_year, rebate_type, amount, age_threshold, start_date) VALUES
      (2026, 'PRIMARY', 17235, 0, '2025-03-01'),
      (2026, 'SECONDARY', 9444, 65, '2025-03-01'),
      (2026, 'TERTIARY', 3145, 75, '2025-03-01')
    ON CONFLICT (tax_year, rebate_type) DO NOTHING`);

    await client.query(`INSERT INTO medical_tax_credits (tax_year, main_member, first_dependant, additional_dependant, start_date) VALUES
      (2026, 364, 364, 246, '2025-03-01')
    ON CONFLICT (tax_year) DO NOTHING`);

    await client.query(`INSERT INTO uif_settings (tax_year, employee_rate, employer_rate, ceiling, start_date) VALUES
      (2026, 1.00, 1.00, 17712, '2025-03-01')
    ON CONFLICT (tax_year) DO NOTHING`);

    await client.query(`INSERT INTO sdl_settings (tax_year, rate, threshold, start_date) VALUES
      (2026, 1.00, 500000, '2025-03-01')
    ON CONFLICT (tax_year) DO NOTHING`);

    await client.query(`INSERT INTO tax_thresholds (tax_year, threshold_type, age_group, amount, start_date, end_date) VALUES
      (2026, 'BELOW_65', 'Under 65', 95750, '2025-03-01', '2026-02-28'),
      (2026, 'AGE_65_TO_74', '65 to 74', 148217, '2025-03-01', '2026-02-28'),
      (2026, 'AGE_75_AND_OVER', '75 and over', 165689, '2025-03-01', '2026-02-28')
    ON CONFLICT DO NOTHING`);

    await client.query(`INSERT INTO tax_brackets (tax_year, bracket_number, min_income, max_income, base_tax, rate, start_date) VALUES
      (2027, 1, 0, 237100, 0, 18.00, '2026-03-01'),
      (2027, 2, 237101, 370500, 42678, 26.00, '2026-03-01'),
      (2027, 3, 370501, 512800, 77362, 31.00, '2026-03-01'),
      (2027, 4, 512801, 673000, 121475, 36.00, '2026-03-01'),
      (2027, 5, 673001, 857900, 179147, 39.00, '2026-03-01'),
      (2027, 6, 857901, 1817000, 251258, 41.00, '2026-03-01'),
      (2027, 7, 1817001, 999999999, 644489, 45.00, '2026-03-01')
    ON CONFLICT (tax_year, bracket_number) DO NOTHING`);

    await client.query(`INSERT INTO tax_rebates (tax_year, rebate_type, amount, age_threshold, start_date) VALUES
      (2027, 'PRIMARY', 17235, 0, '2026-03-01'),
      (2027, 'SECONDARY', 9444, 65, '2026-03-01'),
      (2027, 'TERTIARY', 3145, 75, '2026-03-01')
    ON CONFLICT (tax_year, rebate_type) DO NOTHING`);

    await client.query(`INSERT INTO medical_tax_credits (tax_year, main_member, first_dependant, additional_dependant, start_date) VALUES
      (2027, 364, 364, 246, '2026-03-01')
    ON CONFLICT (tax_year) DO NOTHING`);

    await client.query(`INSERT INTO uif_settings (tax_year, employee_rate, employer_rate, ceiling, start_date) VALUES
      (2027, 1.00, 1.00, 17712, '2026-03-01')
    ON CONFLICT (tax_year) DO NOTHING`);

    await client.query(`INSERT INTO sdl_settings (tax_year, rate, threshold, start_date) VALUES
      (2027, 1.00, 500000, '2026-03-01')
    ON CONFLICT (tax_year) DO NOTHING`);

    await client.query(`INSERT INTO tax_thresholds (tax_year, threshold_type, age_group, amount, start_date, end_date) VALUES
      (2027, 'BELOW_65', 'Under 65', 95750, '2026-03-01', '2027-02-28'),
      (2027, 'AGE_65_TO_74', '65 to 74', 148217, '2026-03-01', '2027-02-28'),
      (2027, 'AGE_75_AND_OVER', '75 and over', 165689, '2026-03-01', '2027-02-28')
    ON CONFLICT DO NOTHING`);

    await client.query(`INSERT INTO roles (code, name, description, permissions) VALUES
      ('ADMIN', 'System Administrator', 'Full system access', '["*"]'),
      ('HR_MANAGER', 'HR Manager', 'Full HR module access', '["hr.*","leave.*","benefits.*"]'),
      ('PAYROLL_ADMIN', 'Payroll Administrator', 'Payroll processing access', '["payroll.*","hr.view"]'),
      ('HR_OFFICER', 'HR Officer', 'Employee management access', '["hr.employees.*","leave.*"]'),
      ('LINE_MANAGER', 'Line Manager', 'Department-level access', '["hr.view","leave.approve","time.*"]'),
      ('EMPLOYEE', 'Employee', 'Self-service access only', '["self.*"]'),
      ('AUDITOR', 'Auditor', 'Read-only access for audit', '["*.view"]')
    ON CONFLICT (code) DO NOTHING`);

    await client.query(`INSERT INTO performance_periods (name, financial_year, start_date, end_date, status) VALUES
      ('2024/2025 Performance Assessment', '2024/2025', '2024-07-01', '2025-06-30', 'ACTIVE')
    ON CONFLICT DO NOTHING`);

    await client.query(`INSERT INTO work_shifts (name, short_description, shift_start_time, shift_end_time, total_hours, has_break, break_duration_minutes, start_date) VALUES
      ('Day Shift', 'Standard 08:00-17:00', '08:00', '17:00', 8.00, TRUE, 60, '2024-01-01'),
      ('Night Shift', 'Night 18:00-06:00', '18:00', '06:00', 12.00, TRUE, 30, '2024-01-01'),
      ('Morning Shift', 'Early 06:00-14:00', '06:00', '14:00', 8.00, TRUE, 30, '2024-01-01'),
      ('Afternoon Shift', 'Afternoon 14:00-22:00', '14:00', '22:00', 8.00, TRUE, 30, '2024-01-01')
    ON CONFLICT DO NOTHING`);

    await client.query(`DELETE FROM titles`);
    await client.query(`INSERT INTO titles (id, name, abbreviation, enabled, sort_order) VALUES
      (1, 'None', 'None', TRUE, 1),
      (2, 'Brigadier', 'Brig', TRUE, 2),
      (3, 'Doctor', 'Dr', TRUE, 3),
      (4, 'Dominee', 'Ds', TRUE, 4),
      (5, 'Miss', 'Miss', TRUE, 5),
      (6, 'Mr/Mrs', 'Mr/Mrs', TRUE, 6),
      (7, 'Mr/Ms', 'Mr/Ms', TRUE, 7),
      (8, 'Mrs', 'Mrs', TRUE, 8),
      (9, 'Ms', 'Ms', TRUE, 9),
      (10, 'Me', 'Me', TRUE, 10),
      (11, 'Mister', 'Mr', TRUE, 11),
      (12, 'Mrs', 'Mrs', TRUE, 12),
      (13, 'Professor', 'Prof', TRUE, 13),
      (14, 'Reverend', 'Rev', TRUE, 14),
      (15, 'Mr', 'Mr', TRUE, 15)
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, abbreviation=EXCLUDED.abbreviation, enabled=EXCLUDED.enabled, sort_order=EXCLUDED.sort_order`);
    await client.query(`SELECT setval('titles_id_seq', COALESCE((SELECT MAX(id) FROM titles), 1))`);

    await client.query(`INSERT INTO ethnic_groups (id, name, enabled, sort_order) VALUES
      (1, 'Foreign National', TRUE, 1),
      (2, 'African', TRUE, 2),
      (3, 'White', TRUE, 3),
      (4, 'Coloured', TRUE, 4),
      (5, 'Asian', FALSE, 5),
      (6, 'Indian', TRUE, 6),
      (7, 'Not Specified', TRUE, 7)
    ON CONFLICT (id) DO NOTHING`);
    await client.query(`SELECT setval('ethnic_groups_id_seq', COALESCE((SELECT MAX(id) FROM ethnic_groups), 1))`);

    await client.query(`INSERT INTO genders (id, name, enabled, sort_order) VALUES
      (1, 'Female', TRUE, 1),
      (2, 'Male', TRUE, 2)
    ON CONFLICT (id) DO NOTHING`);
    await client.query(`SELECT setval('genders_id_seq', COALESCE((SELECT MAX(id) FROM genders), 1))`);

    await client.query(`CREATE TABLE IF NOT EXISTS seed_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMP DEFAULT NOW())`);
    const migrationCheck = await client.query(`SELECT 1 FROM seed_migrations WHERE name = 'fix_employee_mappings_v1'`);
    if (migrationCheck.rows.length === 0) {
      console.log('Correcting existing employee records (gender, title, ethnic group)...');
      await client.query(`UPDATE employees SET gender = CASE gender
        WHEN 'Male' THEN 'Female'
        WHEN 'Female' THEN 'Male'
        ELSE gender END
        WHERE gender IN ('Male', 'Female')`);

      await client.query(`UPDATE employees SET title = CASE title
        WHEN 'Mr' THEN 'Dr'
        WHEN 'Mrs' THEN 'Miss'
        WHEN 'Ms' THEN 'Mrs'
        WHEN 'Dr' THEN 'Ms'
        WHEN 'Prof' THEN 'Me'
        WHEN 'Adv' THEN 'Mr'
        WHEN 'Rev' THEN 'Mrs'
        WHEN 'Cllr' THEN 'Mr'
        ELSE title END
        WHERE title IN ('Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Adv', 'Rev', 'Cllr')`);

      await client.query(`UPDATE employees SET
        race = CASE race
          WHEN 'African' THEN 'Foreign National'
          WHEN 'Coloured' THEN 'African'
          WHEN 'Indian' THEN 'White'
          WHEN 'White' THEN 'Coloured'
          WHEN 'Other' THEN 'Asian'
          WHEN 'Not Specified' THEN 'Indian'
          ELSE race END,
        ethnic_group = CASE ethnic_group
          WHEN 'African' THEN 'Foreign National'
          WHEN 'Coloured' THEN 'African'
          WHEN 'Indian' THEN 'White'
          WHEN 'White' THEN 'Coloured'
          WHEN 'Other' THEN 'Asian'
          WHEN 'Not Specified' THEN 'Indian'
          ELSE ethnic_group END
        WHERE race IN ('African', 'Coloured', 'Indian', 'White', 'Other', 'Not Specified')
          OR ethnic_group IN ('African', 'Coloured', 'Indian', 'White', 'Other', 'Not Specified')`);

      await client.query(`UPDATE employee_medical_aid_dependants SET gender = CASE gender
        WHEN 'Male' THEN 'Female'
        WHEN 'Female' THEN 'Male'
        ELSE gender END
        WHERE gender IN ('Male', 'Female')`);

      await client.query(`INSERT INTO seed_migrations (name) VALUES ('fix_employee_mappings_v1')`);
      console.log('Employee record corrections applied.');
    } else {
      console.log('Employee mapping corrections already applied, skipping.');
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seed };
