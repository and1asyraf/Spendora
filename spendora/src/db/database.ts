import Dexie, { Table } from 'dexie';

// Define interfaces for our database tables
export interface Expense {
  id?: number;
  title: string;
  amount: number;
  category: string;
  date: Date;
  receipt_uri?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
}

// Create the database class
export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense>;
  categories!: Table<Category>;

  constructor() {
    super('ExpenseDB');
    
    this.version(1).stores({
      expenses: '++id, title, amount, category, date, created_at, updated_at',
      categories: '++id, name, description'
    });
  }
}

// Create a singleton instance
export const db = new ExpenseDatabase();

// Initialize default categories
export const initializeDefaultCategories = async () => {
  const defaultCategories = [
    { name: 'Food', description: 'Groceries and dining out' },
    { name: 'Transport', description: 'Public transport and fuel' },
    { name: 'Bills', description: 'Utilities and subscriptions' },
    { name: 'Entertainment', description: 'Movies, games, and leisure' },
    { name: 'Shopping', description: 'Clothes and personal items' },
    { name: 'Other', description: 'Miscellaneous expenses' }
  ];

  for (const category of defaultCategories) {
    const exists = await db.categories.where('name').equals(category.name).first();
    if (!exists) {
      await db.categories.add(category);
    }
  }
}; 