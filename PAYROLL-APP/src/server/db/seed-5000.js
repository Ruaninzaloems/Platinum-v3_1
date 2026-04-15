const { query: dbQuery, getClient } = require('../config/database');

const SA_FIRST_NAMES_M = ['Sipho','Thabo','Mandla','Bongani','Sibusiso','Themba','Zakhele','Nkosinathi','Siphiwe','Mthokozisi','Dumisani','Siyabonga','Bheki','Mfanafuthi','Philani','Nhlanhla','Thabiso','Vusi','Jabulani','Sifiso','Lindani','Bonga','Sandile','Lucky','Wiseman','John','David','Peter','Michael','James','Daniel','Andrew','Robert','William','Pieter','Jan','Johan','Andries','Abraham','Christiaan','Francois','Hendrik','Willem','Jacobus','Gerhard','Ernst','Stefan','Marius','Jacques','Danie','Mohammed','Ahmed','Abdul','Yusuf','Ismail','Mogale','Tshepiso','Kabelo','Tshepo','Kagiso','Lebogang','Mpho','Thato','Katlego','Tumelo','Tebogo','Ofentse','Thabang','Obakeng','Lesedi','Rajesh','Suresh','Pravin','Vikram','Ashwin','Sanjay','Deepak','Anand'];
const SA_FIRST_NAMES_F = ['Nomvula','Thandi','Zanele','Nomthandazo','Nonhlanhla','Busisiwe','Zinhle','Lindiwe','Nokuthula','Nompumelelo','Ntombizodwa','Sizakele','Phindile','Nokukhanya','Thandeka','Nosipho','Nozipho','Phumzile','Sindisiwe','Khanyisile','Sarah','Mary','Patricia','Elizabeth','Jennifer','Susan','Maria','Anna','Catherine','Margaret','Hester','Aletta','Cornelia','Johanna','Petronella','Bettie','Magda','Elsa','Fatima','Ayesha','Khadija','Amina','Zainab','Dineo','Palesa','Lerato','Mpho','Kgomotso','Boitumelo','Tshegofatso','Keitumetse','Amogelang','Naledi','Refilwe','Priya','Anjali','Sunita','Meera','Kavitha'];
const SA_SURNAMES = ['Nkosi','Dlamini','Zulu','Ndlovu','Mkhize','Ngcobo','Shabalala','Sithole','Ntuli','Khumalo','Cele','Nxumalo','Mthembu','Zwane','Maseko','Vilakazi','Buthelezi','Gumede','Mabaso','Hlongwane','Ngubane','Mbatha','Maharaj','Pillay','Govender','Naidoo','Moodley','Reddy','Singh','Padayachee','Van der Merwe','Botha','Du Plessis','Pretorius','Nel','Van Zyl','Joubert','Swanepoel','Kruger','Steyn','Venter','Coetzee','Jansen','De Villiers','Fouche','Mostert','Erasmus','Louw','Cilliers','Smit','Du Toit','Meyer','Bezuidenhout','Potgieter','Barnard','De Beer','Brits','Grobler','Lombard','Van Wyk','Mokoena','Molefe','Masemola','Matlala','Selepe','Ramaila','Mahlangu','Mashego','Maluleke','Tshabalala','Radebe','Mthethwa','Kubheka','Mabena','Sibiya','Zungu','Xaba','Mhlongo','Majola','Mthiyane','Smith','Williams','Johnson','Brown','Jones','Petersen','Adams','Isaacs','Hendricks','Martin','Abrahams','Paulse','Jacobs','September','Davids','Daniels','Joseph','Osman','Cassim','Ebrahim','Khan','Moosa','Patel','Desai','Chuturgoon'];

const TITLES = ['Mr','Ms','Mrs','Dr','Prof','Adv'];
const GENDERS = ['Male','Female'];
const RACES = ['AFRICAN','COLOURED','INDIAN','WHITE'];
const LANGS = ['ENGLISH','AFRIKAANS','ZULU','XHOSA','SOTHO','TSWANA','PEDI','VENDA','TSONGA','SWATI','NDEBELE'];
const MARITAL = ['SINGLE','MARRIED','DIVORCED','WIDOWED'];
const PROVINCES = ['GAUTENG','KWAZULU_NATAL','WESTERN_CAPE','EASTERN_CAPE','FREE_STATE','LIMPOPO','MPUMALANGA','NORTH_WEST','NORTHERN_CAPE'];
const BANKS = ['ABSA','FNB','Nedbank','Standard Bank','Capitec','African Bank','Investec','TymeBank'];
const BRANCH_CODES = ['632005','250655','198765','051001','470010','430000','580105','678910'];
const ACC_TYPES = ['SAVINGS','CHEQUE','TRANSMISSION'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function chance(pct) { return Math.random() * 100 < pct; }
function padNum(n, len) { return String(n).padStart(len, '0'); }

function genSAID(dob) {
  const y = dob.getFullYear() % 100;
  const m = dob.getMonth() + 1;
  const d = dob.getDate();
  const seq = rand(0, 9999);
  const citizen = rand(0, 1) === 0 ? 0 : 1;
  const race = 8;
  const partial = `${padNum(y,2)}${padNum(m,2)}${padNum(d,2)}${padNum(seq,4)}${citizen}${race}`;
  let sum = 0, alt = false;
  for (let i = partial.length - 1; i >= 0; i--) {
    let n = parseInt(partial[i]);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  const check = (10 - (sum % 10)) % 10;
  return partial + check;
}

function genDOB(minAge, maxAge) {
  const now = new Date(2026, 2, 3);
  const age = rand(minAge, maxAge);
  return new Date(now.getFullYear() - age, rand(0, 11), rand(1, 28));
}

function genJoinDate(dob) {
  const earliest = new Date(dob.getFullYear() + 18, dob.getMonth(), 1);
  const latest = new Date(2025, 11, 31);
  const diff = latest.getTime() - earliest.getTime();
  return new Date(earliest.getTime() + Math.random() * diff);
}

function genEmail(first, surname, idx) {
  return `${first.toLowerCase().replace(/\s/g,'')}.${surname.toLowerCase().replace(/\s/g,'')}${idx}@platinum.gov.za`;
}

function genCellNumber() {
  const prefixes = ['060','061','062','063','064','065','066','067','068','069','071','072','073','074','076','078','079','081','082','083','084'];
  return pick(prefixes) + padNum(rand(1000000, 9999999), 7);
}

function genTaxNumber() {
  return padNum(rand(100000000, 999999999), 10);
}

async function seed() {
  console.log('Starting 5000 employee seed...');
  const startTime = Date.now();

  const shRes = await dbQuery('SELECT id, code, name, transaction_type, calculation_method FROM salary_heads ORDER BY id');
  const salaryHeads = shRes.rows;

  const earnings = salaryHeads.filter(h => h.transaction_type === 'EARNING' && h.code !== 'BASIC');
  const deductions = salaryHeads.filter(h => h.transaction_type === 'DEDUCTION' && !['PAYE','UIF_EE'].includes(h.code));
  const companyContribs = salaryHeads.filter(h => h.transaction_type === 'COMPANY_CONTRIBUTION' && !['UIF_ER','SDL'].includes(h.code));
  const fringeBenefits = salaryHeads.filter(h => h.transaction_type === 'FRINGE_BENEFIT');
  const basicHead = salaryHeads.find(h => h.code === 'BASIC');
  const pensionEE = salaryHeads.find(h => h.code === 'PENSION_EE');
  const pensionER = salaryHeads.find(h => h.code === 'PENSION_ER');
  const medEE = salaryHeads.find(h => h.code === 'MED_AID_EE');
  const medER = salaryHeads.find(h => h.code === 'MED_AID_ER');
  const unionFee = salaryHeads.find(h => h.code === 'UNION_FEE');

  const deptCount = 8;
  const divCount = 24;
  const BATCH_SIZE = 250;
  const TOTAL = 5000;

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const empRows = [];
    const empTxMap = [];

    for (let i = 0; i < TOTAL; i++) {
      const seqIdx = i;
      const isFemale = chance(48);
      const gender = isFemale ? 'Female' : 'Male';
      const firstName = isFemale ? pick(SA_FIRST_NAMES_F) : pick(SA_FIRST_NAMES_M);
      const surname = pick(SA_SURNAMES);
      const title = isFemale ? pick(['Ms','Mrs','Dr']) : pick(['Mr','Dr','Prof']);
      const initials = firstName[0] + String.fromCharCode(65 + rand(0, 25));
      const dob = genDOB(22, 63);
      const joinDate = genJoinDate(dob);
      const idNumber = genSAID(dob);
      const email = genEmail(firstName, surname, i + 26);
      const cell = genCellNumber();
      const taxNo = genTaxNumber();
      const race = pick(RACES);
      const lang = pick(LANGS);
      const marital = pick(MARITAL);
      const dependants = rand(0, 5);
      const province = pick(PROVINCES);
      const bank = pick(BANKS);
      const branchCode = pick(BRANCH_CODES);
      const accNumber = padNum(rand(1000000000, 9999999999), 10);
      const accType = pick(ACC_TYPES);

      const deptId = rand(1, deptCount);
      const divId = rand(1, divCount);

      const gradeIdx = rand(0, 18);
      const taskGradeId = gradeIdx + 1;
      const notch = rand(1, 5);

      let empTypeId, empSubtypeId, cosId;
      if (gradeIdx >= 17) {
        empTypeId = 5; empSubtypeId = pick([7,8,9]); cosId = 2;
      } else if (gradeIdx >= 14) {
        empTypeId = pick([1,1,1,2]); empSubtypeId = empTypeId === 2 ? 3 : 1; cosId = 2;
      } else if (chance(5)) {
        empTypeId = 4; empSubtypeId = pick([5,6]); cosId = 3;
      } else if (chance(10)) {
        empTypeId = 2; empSubtypeId = 3; cosId = pick([1,2]);
      } else if (chance(8)) {
        empTypeId = 3; empSubtypeId = 4; cosId = 1;
      } else {
        empTypeId = 1; empSubtypeId = chance(5) ? 2 : 1; cosId = chance(15) ? 4 : pick([1,2]);
      }

      const salaryGrades = [
        {min:120000,max:160000},{min:140000,max:185000},{min:155000,max:210000},{min:175000,max:240000},
        {min:195000,max:275000},{min:220000,max:310000},{min:250000,max:360000},{min:290000,max:420000},
        {min:340000,max:490000},{min:400000,max:580000},{min:470000,max:680000},{min:550000,max:800000},
        {min:650000,max:950000},{min:780000,max:1100000},{min:900000,max:1350000},{min:1050000,max:1600000},
        {min:1250000,max:1900000},{min:1500000,max:2300000},{min:2000000,max:3000000}
      ];
      const grade = salaryGrades[gradeIdx];
      const notchStep = (grade.max - grade.min) / 4;
      const annualSalary = Math.round(grade.min + (notch - 1) * notchStep);
      const monthlyBasic = Math.round(annualSalary / 12 * 100) / 100;

      const empCode = 'EMP' + padNum(i + 26, 5);
      const status = chance(3) ? 'TERMINATED' : (chance(2) ? 'SUSPENDED' : 'ACTIVE');
      const disability = chance(4) ? 'YES' : 'NO';
      const hoursPerDay = empSubtypeId === 2 ? 4 : 8;
      const daysPerWeek = empSubtypeId === 2 ? 5 : 5;
      const excludeUif = annualSalary > 212544 * 12 ? false : false;

      empRows.push([
        empCode, idNumber, title, initials, firstName, null, surname,
        firstName.substring(0, Math.min(firstName.length, rand(3, firstName.length))),
        dob.toISOString().substring(0, 10), gender, lang, marital, dependants,
        null, null, email, null, null, cell,
        joinDate.toISOString().substring(0, 10), null,
        taxNo, false, false,
        `${rand(1,999)} ${pick(['Main','Church','Voortrekker','Nelson Mandela','Sisulu','Market','Station','Long','Adderley','Commissioner'])} Street`,
        pick(['Extension '+rand(1,20), 'Phase '+rand(1,5), '']),
        padNum(rand(1000,9999), 4),
        province,
        pick(['Johannesburg','Pretoria','Durban','Cape Town','Bloemfontein','Polokwane','Nelspruit','Mahikeng','Kimberley','Pietermaritzburg','East London','Port Elizabeth','Rustenburg','Emalahleni','Middelburg']),
        null, null, null,
        'EFT', bank, branchCode, accNumber, accType, `${firstName} ${surname}`,
        null,
        empTypeId, empSubtypeId, cosId, taskGradeId, notch,
        annualSalary, status, race, disability, 'South African',
        hoursPerDay, daysPerWeek, status === 'ACTIVE'
      ]);

      const txStartDate = joinDate.toISOString().substring(0, 10);
      const txForThisEmp = [];

      txForThisEmp.push([basicHead.id, monthlyBasic, null, txStartDate]);

      if (pensionEE && chance(80)) {
        const pct = pick([7.5, 7.5, 7.5, 8, 8.5, 9]);
        txForThisEmp.push([pensionEE.id, 0, pct, txStartDate]);
      }
      if (pensionER && chance(80)) {
        const pct = pick([13, 13, 14, 15, 16]);
        txForThisEmp.push([pensionER.id, 0, pct, txStartDate]);
      }
      if (medEE && chance(70)) {
        const amt = pick([1800, 2100, 2400, 2700, 3000, 3400, 3800, 4200, 4800, 5500]);
        txForThisEmp.push([medEE.id, amt, null, txStartDate]);
      }
      if (medER && chance(70)) {
        const amt = pick([1800, 2100, 2400, 2700, 3000, 3400, 3800, 4200, 4800, 5500]);
        txForThisEmp.push([medER.id, amt, null, txStartDate]);
      }
      if (unionFee && chance(55)) {
        const pct = pick([1, 1, 1.25, 1.5]);
        txForThisEmp.push([unionFee.id, 0, pct, txStartDate]);
      }

      const earningProbabilities = {
        'HOUSING': 65, 'TRANSPORT': 60, 'CELLPHONE': 40, 'ACTING': 8,
        'STANDBY': gradeIdx < 10 ? 15 : 3, 'OT_15': gradeIdx < 12 ? 25 : 2,
        'OT_20': gradeIdx < 12 ? 15 : 1, 'OT_SUNDAY': gradeIdx < 10 ? 10 : 0,
        'OT_PH': gradeIdx < 10 ? 8 : 0, 'NIGHT_SHIFT': gradeIdx < 8 ? 12 : 0,
        'BONUS_13': 70, 'BONUS_PERF': 15, 'BONUS_LUMP': 3, 'BONUS_ADHOC': 5,
        'LEAVE_ENCASH': 5, 'SEVERANCE': 1, 'DANGER': gradeIdx < 8 ? 10 : 0,
        'TOOL': gradeIdx < 6 ? 8 : 0, 'UNIFORM': gradeIdx < 8 ? 12 : 0,
        'SCARCE_SKILL': gradeIdx >= 8 ? 10 : 2, 'LOCALITY': 8,
        'LONG_SERVICE': 5, 'BACK_PAY': 3, 'TRAVEL_REIMB': gradeIdx >= 10 ? 15 : 5,
        'SUBSISTENCE': gradeIdx >= 8 ? 12 : 3
      };

      for (const eh of earnings) {
        const prob = earningProbabilities[eh.code] || 5;
        if (!chance(prob)) continue;
        let amt = 0;
        switch (eh.code) {
          case 'HOUSING': amt = pick([2500,3000,3500,4000,4500,5000,5500,6000,7000,8000]) * (1 + gradeIdx * 0.08); break;
          case 'TRANSPORT': amt = pick([1200,1500,1800,2000,2500,3000,3500,4000]) * (1 + gradeIdx * 0.05); break;
          case 'CELLPHONE': amt = pick([400,500,600,750,900,1200,1500,2000,2500]); break;
          case 'ACTING': amt = monthlyBasic * pick([0.05,0.08,0.10,0.12,0.15]); break;
          case 'STANDBY': amt = pick([500,750,1000,1500,2000,2500]); break;
          case 'OT_15': { const hrs = rand(5, 40); const rate = monthlyBasic / 173.33; amt = hrs * rate * 1.5; break; }
          case 'OT_20': { const hrs = rand(2, 20); const rate = monthlyBasic / 173.33; amt = hrs * rate * 2.0; break; }
          case 'OT_SUNDAY': { const hrs = rand(4, 16); const rate = monthlyBasic / 173.33; amt = hrs * rate * 2.0; break; }
          case 'OT_PH': { const hrs = rand(4, 12); const rate = monthlyBasic / 173.33; amt = hrs * rate * 2.0; break; }
          case 'NIGHT_SHIFT': amt = pick([800,1000,1200,1500,2000,2500,3000]); break;
          case 'BONUS_13': amt = monthlyBasic; break;
          case 'BONUS_PERF': amt = monthlyBasic * pick([0.5,0.75,1.0,1.25,1.5]); break;
          case 'BONUS_LUMP': amt = pick([5000,10000,15000,20000,25000,30000]); break;
          case 'BONUS_ADHOC': amt = pick([2000,3000,5000,7500,10000]); break;
          case 'LEAVE_ENCASH': { const days = rand(5, 20); amt = (monthlyBasic / 21.67) * days; break; }
          case 'SEVERANCE': amt = monthlyBasic * pick([1,2,3,4]); break;
          case 'DANGER': amt = pick([500,750,1000,1500,2000]); break;
          case 'TOOL': amt = pick([300,500,750,1000]); break;
          case 'UNIFORM': amt = pick([200,350,500,750,1000]); break;
          case 'SCARCE_SKILL': amt = monthlyBasic * pick([0.05,0.08,0.10,0.12,0.15,0.20]); break;
          case 'LOCALITY': amt = pick([500,750,1000,1500,2000,3000]); break;
          case 'LONG_SERVICE': amt = pick([1000,2000,3000,5000,7500,10000]); break;
          case 'BACK_PAY': amt = monthlyBasic * pick([0.5,1.0,1.5,2.0]); break;
          case 'TRAVEL_REIMB': amt = pick([1500,2000,2500,3000,4000,5000,6000]); break;
          case 'SUBSISTENCE': amt = pick([1000,1500,2000,2500,3000,4000]); break;
          default: amt = pick([500,1000,1500,2000,3000]); break;
        }
        amt = Math.round(amt * 100) / 100;
        if (amt > 0) txForThisEmp.push([eh.id, amt, null, txStartDate]);
      }

      for (const fb of fringeBenefits) {
        if (chance(gradeIdx >= 12 ? 20 : 5)) {
          const amt = pick([2000, 3000, 4500, 6000, 8000, 10000, 15000]);
          txForThisEmp.push([fb.id, amt, null, txStartDate]);
        }
      }

      empTxMap.push(txForThisEmp);

      if ((i + 1) % 500 === 0) {
        console.log(`  Generated ${i + 1} / ${TOTAL} employees...`);
      }
    }

    console.log(`Inserting ${empRows.length} employees...`);

    const actualEmpIds = [];
    for (let b = 0; b < empRows.length; b += BATCH_SIZE) {
      const batch = empRows.slice(b, b + BATCH_SIZE);
      const placeholders = [];
      const params = [];
      let pIdx = 1;
      for (const row of batch) {
        const ph = row.map(() => `$${pIdx++}`);
        placeholders.push(`(${ph.join(',')})`);
        params.push(...row);
      }
      const res = await client.query(
        `INSERT INTO employees (
          employee_code, id_number, title, initials, first_name, second_name, surname,
          known_as, date_of_birth, gender, language, marital_status, dependants,
          passport_number, passport_country, email_address, home_number, work_number, cell_number,
          joining_date, end_date,
          income_tax_number, exclude_uif, exclude_sdl,
          physical_address_1, physical_address_2, physical_postal_code, physical_province, physical_city,
          postal_address_1, postal_address_2, postal_postal_code,
          payment_type, bank_name, bank_branch_code, bank_account_number, bank_account_type, bank_account_holder,
          position_id,
          employee_type_id, employee_subtype_id, condition_of_service_id, task_grade_id, current_notch,
          annual_salary, status, race, disability_status, nationality,
          working_hours_per_day, working_days_per_week, enabled
        ) VALUES ${placeholders.join(',')} RETURNING id`,
        params
      );
      for (const row of res.rows) actualEmpIds.push(row.id);
      if ((b + BATCH_SIZE) % 1000 === 0 || b + BATCH_SIZE >= empRows.length) {
        console.log(`  Inserted ${Math.min(b + BATCH_SIZE, empRows.length)} / ${empRows.length} employees`);
      }
    }

    const txValues = [];
    let totalTx = 0;
    for (let i = 0; i < empTxMap.length; i++) {
      const realId = actualEmpIds[i];
      for (const [shid, amt, pct, sd] of empTxMap[i]) {
        txValues.push([realId, shid, amt, pct, sd]);
        totalTx++;
      }
    }

    console.log(`Inserting ${totalTx} salary transactions...`);

    for (let b = 0; b < txValues.length; b += BATCH_SIZE) {
      const batch = txValues.slice(b, b + BATCH_SIZE);
      const placeholders = [];
      const params = [];
      let pIdx = 1;
      for (const [eid, shid, amt, pct, sd] of batch) {
        placeholders.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
        params.push(eid, shid, amt, pct, sd);
      }
      await client.query(
        `INSERT INTO employee_salary_transactions (employee_id, salary_head_id, amount, percentage, start_date)
         VALUES ${placeholders.join(',')}`,
        params
      );
      if ((b + BATCH_SIZE) % 5000 === 0 || b + BATCH_SIZE >= txValues.length) {
        console.log(`  Inserted ${Math.min(b + BATCH_SIZE, txValues.length)} / ${txValues.length} transactions`);
      }
    }

    await client.query('COMMIT');

    const finalCount = await dbQuery('SELECT COUNT(*) as cnt FROM employees');
    const txCount = await dbQuery('SELECT COUNT(*) as cnt FROM employee_salary_transactions');
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n=== SEED COMPLETE ===');
    console.log(`Total employees: ${finalCount.rows[0].cnt}`);
    console.log(`Total salary transactions: ${txCount.rows[0].cnt}`);
    console.log(`Time: ${elapsed}s`);

    const stats = await dbQuery(`
      SELECT sh.code, sh.name, sh.transaction_type, COUNT(*) as assignment_count
      FROM employee_salary_transactions est
      JOIN salary_heads sh ON est.salary_head_id = sh.id
      WHERE est.employee_id > 25
      GROUP BY sh.code, sh.name, sh.transaction_type
      ORDER BY sh.transaction_type, assignment_count DESC
    `);
    console.log('\n=== TRANSACTION DISTRIBUTION ===');
    for (const s of stats.rows) {
      console.log(`  ${s.transaction_type.padEnd(22)} ${s.code.padEnd(16)} ${s.name.padEnd(32)} ${s.assignment_count} employees`);
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('SEED FAILED:', err.message);
    throw err;
  } finally {
    client.release();
  }

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
