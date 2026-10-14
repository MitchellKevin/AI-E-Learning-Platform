import {
  mockBadgeTotal,
  mockBadges,
  mockCertificates,
  mockLeaderboard,
  mockProgress,
  mockStats,
  mockUser,
} from "./mock-user";

// Gebruikersdata. Nu op mock-data; later dezelfde functies op MongoDB laten draaien.

export async function getCurrentUser() {
  return mockUser;
}

export async function getProgress() {
  return mockProgress;
}

export async function getStats() {
  return mockStats;
}

export async function getLeaderboard() {
  return mockLeaderboard;
}

export async function getBadges() {
  return { badges: mockBadges, total: mockBadgeTotal };
}

export async function getCertificates() {
  return mockCertificates;
}
