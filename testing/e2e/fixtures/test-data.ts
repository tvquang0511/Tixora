/**
 * Test data fixtures for Tixora Playwright E2E tests.
 * Synchronized with prisma/seed.ts and prisma/seeds/seed-data.ts.
 */

export const TEST_USERS = {
  admin: {
    email: 'vy.admin@tixora.local',
    password: 'Password123@',
    name: 'Vy Admin',
    role: 'Admin',
  },
  adminSecondary: {
    email: 'vuong.admin@tixora.local',
    password: 'Password123@',
    name: 'Vuong Admin',
    role: 'Admin',
  },
  organizer: {
    email: 'tuan.organizer@tixora.local',
    password: 'Password123@',
    name: 'Tuan Organizer',
    role: 'Organizer',
  },
  checker: {
    email: 'quang.checker@tixora.local',
    password: 'Password123@',
    name: 'Quang Checker',
    role: 'Checker',
    assignedGate: 1,
  },
  audience: {
    email: 'audience1@tixora.local',
    password: 'Password123@',
    name: 'Audience User',
    role: 'Audience',
  },
  invalidUser: {
    email: 'nonexistent.user@tixora.local',
    password: 'WrongPassword999!',
  },
};

export const TEST_CONCERTS = {
  anhTraiChongGai: {
    id: 'c09a6502-e081-483a-96f6-d0001c06b5d1',
    name: '[CONCERT ENCORE] ANH TRAI VƯỢT NGÀN CHÔNG GAI DAY7, DAY8',
    location: 'The Global City',
    searchKeyword: 'Chông Gai',
  },
  anhTraiSayHi: {
    id: 'f3d948b0-2ca9-4cd6-8fd0-0fcf10dcaa4f',
    name: 'ANH TRAI "SAY HI" CONCERT',
    searchKeyword: 'Say Hi',
  },
};

export const URLS = {
  web: {
    home: '/',
    login: '/login',
    register: '/register',
    myTickets: '/my-tickets',
    orders: '/orders',
    catalog: '/catalog',
  },
  admin: {
    login: '/login',
    dashboard: '/dashboard',
    events: '/events',
    createEvent: '/create-event',
    assignments: '/assignments',
    revenue: '/revenue',
    users: '/users',
    jobs: '/jobs',
  },
};
