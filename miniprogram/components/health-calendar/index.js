Component({
  properties: {
    value: { type: String, value: '' },
    marked: { type: Array, value: [] }
  },
  data: {
    year: 0,
    month: 0,
    today: '',
    weeks: []
  },
  lifetimes: {
    attached() {
      const now = new Date();
      const today = this._fmt(now);
      this.setData({ year: now.getFullYear(), month: now.getMonth() + 1, today });
      if (!this.data.value) this.triggerEvent('change', { date: today });
      this.render();
    }
  },
  observers: {
    'marked, value': function () { this.render(); }
  },
  methods: {
    _fmt(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    _dateKey(year, month, day) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    },
    render() {
      const { year, month, marked } = this.data;
      const first = new Date(year, month - 1, 1);
      const startWeek = first.getDay();
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = [];
      const todayPrefix = this.data.today.slice(0, 7);
      for (let i = 0; i < startWeek; i++) days.push(null);
      for (let d = 1; d <= daysInMonth; d++) {
        const date = this._dateKey(year, month, d);
        days.push({
          day: d,
          date,
          isToday: date === this.data.today,
          isSelected: date === this.data.value,
          isMarked: marked.indexOf(date) >= 0
        });
      }
      while (days.length % 7 !== 0) days.push(null);
      const weeks = [];
      for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
      this.setData({ weeks });
    },
    prevMonth() {
      let { year, month } = this.data;
      month -= 1;
      if (month < 1) { month = 12; year -= 1; }
      this.setData({ year, month });
      this.render();
    },
    nextMonth() {
      let { year, month } = this.data;
      month += 1;
      if (month > 12) { month = 1; year += 1; }
      this.setData({ year, month });
      this.render();
    },
    onSelect(e) {
      const date = e.currentTarget.dataset.date;
      if (!date) return;
      this.triggerEvent('change', { date });
    }
  }
});