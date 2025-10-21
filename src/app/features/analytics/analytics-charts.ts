import { Component, input } from '@angular/core';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analytics-charts',
  imports: [CommonModule],
  templateUrl: './analytics-charts.html',
  styleUrl: './analytics-charts.scss'
})
export class AnalyticsCharts {

  cashflow = input<any[]>([]);
  yieldShare = input<any[]>([]);

  colors = ['#3b82f6', '#16a34a', '#f59e0b', '#ef4444', '#a855f7'];
}
