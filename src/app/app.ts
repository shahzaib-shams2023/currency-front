import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConversionRecord } from './model/history.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Currency {
  code: string;
  name: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['app.css'],
  imports: [FormsModule , CommonModule]
})
export class AppComponent implements OnInit {
  currencies: Currency[] = [];
  from = 'USD';
  to = 'EUR';
  amount = 1;
  date = '';
  result: number | null = null;
  rate: number | null = null;
  loading = false;
  error = '';

  history: ConversionRecord[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCurrencies();
    this.loadHistory();
  }

  loadCurrencies() {
    this.http.get<any>('https://currency-g8sf.onrender.com/currencies').subscribe({
      next: (res) => {
        this.currencies = Object.entries(res.data).map(([code, info]: [string, any]) => ({
          code,
          name: info.name,
        }));
        this.currencies.sort((a, b) => a.code.localeCompare(b.code));
      },
      error: () => {
        this.error = 'Failed to load currencies';
      },
    });
  }

  convert() {
    if (!this.amount || this.amount <= 0) {
      this.error = 'Please enter a valid amount';
      return;
    }

    this.loading = true;
    this.error = '';
    this.http
      .post<any>('https://currency-g8sf.onrender.com/convert', {
        from: this.from,
        to: this.to,
        amount: this.amount,
        date: this.date || undefined,
      })
      .subscribe({
        next: (res) => {
          this.result = res.converted;
          this.rate = res.rate;
          this.saveToHistory(res);
        },
        error: (err) => {
          this.error = 'Conversion failed. Check inputs or try again.';
          console.error(err);
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  saveToHistory(record: any) {
    const fullRecord: ConversionRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    };
    this.history.unshift(fullRecord); 
    localStorage.setItem('conversionHistory', JSON.stringify(this.history));
  }

  loadHistory() {
    const saved = localStorage.getItem('conversionHistory');
    if (saved) {
      this.history = JSON.parse(saved);
    }
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }
}