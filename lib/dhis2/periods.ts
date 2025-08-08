
export type PeriodType = 
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'sixmonthly'
  | 'yearly'
  | 'financialYear'
  | 'relative';

export interface Period {
  id: string;
  name: string;
  displayName: string;
  startDate: string;
  endDate: string;
  periodType: PeriodType;
  code: string;
}

export interface RelativePeriod {
  id: string;
  name: string;
  type: 'THIS' | 'LAST' | 'LAST_12_MONTHS' | 'LAST_4_QUARTERS' | 'LAST_2_SIXMONTHS';
}

export class DHIS2PeriodGenerator {
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static getLastDayOfMonth(year: number, month: number): string {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }

  static generateFixedPeriods(type: PeriodType, year: number): Period[] {
    switch (type) {
      case 'yearly':
        return this.generateYearlyPeriods(year);
      case 'sixmonthly':
        return this.generateSixMonthlyPeriods(year);
      case 'quarterly':
        return this.generateQuarterlyPeriods(year);
      case 'monthly':
        return this.generateMonthlyPeriods(year);
      case 'weekly':
        return this.generateWeeklyPeriods(year);
      default:
        return [];
    }
  }

  static generateYearlyPeriods(year: number): Period[] {
    return [{
      id: year.toString(),
      name: year.toString(),
      displayName: year.toString(),
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      periodType: 'yearly',
      code: year.toString()
    }];
  }

  static generateQuarterlyPeriods(year: number): Period[] {
    const quarters = [
      { id: 'Q1', startMonth: 0, endMonth: 2 },
      { id: 'Q2', startMonth: 3, endMonth: 5 },
      { id: 'Q3', startMonth: 6, endMonth: 8 },
      { id: 'Q4', startMonth: 9, endMonth: 11 }
    ];

    return quarters.map(q => ({
      id: `${year}${q.id}`,
      name: `${year} ${q.id}`,
      displayName: `${year} ${q.id}`,
      startDate: `${year}-${String(q.startMonth + 1).padStart(2, '0')}-01`,
      endDate: this.getLastDayOfMonth(year, q.endMonth),
      periodType: 'quarterly',
      code: `${year}Q${q.id.substring(1)}`
    }));
  }

  static generateSixMonthlyPeriods(year: number): Period[] {
    const semesters = [
      { id: 'S1', startMonth: 0, endMonth: 5 },
      { id: 'S2', startMonth: 6, endMonth: 11 }
    ];

    return semesters.map(s => ({
      id: `${year}${s.id}`,
      name: `${year} ${s.id}`,
      displayName: `${year} ${s.id}`,
      startDate: `${year}-${String(s.startMonth + 1).padStart(2, '0')}-01`,
      endDate: this.getLastDayOfMonth(year, s.endMonth),
      periodType: 'sixmonthly',
      code: `${year}S${s.id.substring(1)}`
    }));
  }

  static generateMonthlyPeriods(year: number): Period[] {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months.map(month => {
      const monthNum = String(month + 1).padStart(2, '0');
      return {
        id: `${year}${monthNum}`,
        name: `${monthNames[month]} ${year}`,
        displayName: `${monthNames[month]} ${year}`,
        startDate: `${year}-${monthNum}-01`,
        endDate: this.getLastDayOfMonth(year, month),
        periodType: 'monthly',
        code: `${year}${monthNum}`
      };
    });
  }

  static generateWeeklyPeriods(year: number): Period[] {
    const weeks: Period[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    let currentDate = startDate;
    let weekNumber = 1;

    while (currentDate <= endDate) {
      const weekStart = this.formatDate(currentDate);
      const weekEnd = this.formatDate(new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000));
      
      weeks.push({
        id: `${year}W${weekNumber}`,
        name: `Week ${weekNumber}, ${year}`,
        displayName: `Week ${weekNumber}, ${year}`,
        startDate: weekStart,
        endDate: weekEnd,
        periodType: 'weekly',
        code: `${year}W${weekNumber}`
      });

      currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      weekNumber++;
    }

    return weeks;
  }

  static getRelativePeriods(): RelativePeriod[] {
    return [
      { id: 'THIS_MONTH', name: 'This Month', type: 'THIS' },
      { id: 'LAST_MONTH', name: 'Last Month', type: 'LAST' },
      { id: 'LAST_3_MONTHS', name: 'Last 3 Months', type: 'LAST' },
      { id: 'LAST_12_MONTHS', name: 'Last 12 Months', type: 'LAST_12_MONTHS' },
      { id: 'THIS_QUARTER', name: 'This Quarter', type: 'THIS' },
      { id: 'LAST_QUARTER', name: 'Last Quarter', type: 'LAST' },
      { id: 'LAST_4_QUARTERS', name: 'Last 4 Quarters', type: 'LAST_4_QUARTERS' },
      { id: 'THIS_YEAR', name: 'This Year', type: 'THIS' },
      { id: 'LAST_YEAR', name: 'Last Year', type: 'LAST' }
    ];
  }
}
