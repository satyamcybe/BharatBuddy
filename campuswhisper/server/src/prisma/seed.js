require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const ROOMS = ['academics', 'placements', 'study', 'vent', 'ideas', 'productivity', 'sos', 'talk'];

const SEED_DATA = {
  academics: [
    { title: 'NPTEL Python Notes', url: 'https://nptel.ac.in/courses/106', tag: 'notes' },
    { title: 'Linear Algebra Cheat Sheet', url: 'https://drive.google.com/file/la-cheat', tag: 'cheatsheet' },
    { title: 'DSA Roadmap 2024', url: 'https://roadmap.sh/computer-science', tag: 'roadmap' },
  ],
  placements: [
    { title: 'Placement Prep Guide', url: 'https://github.com/kdn251/interviews', tag: 'guide' },
    { title: 'Resume Template', url: 'https://drive.google.com/file/resume-template', tag: 'template' },
    { title: 'Top 100 Coding Questions', url: 'https://leetcode.com/problemset/', tag: 'practice' },
  ],
  study: [
    { title: 'Pomodoro Timer App', url: 'https://pomofocus.io', tag: 'tool' },
    { title: 'Notion Study Template', url: 'https://notion.so/templates/study', tag: 'template' },
    { title: 'Khan Academy Free Courses', url: 'https://khanacademy.org', tag: 'course' },
  ],
  vent: [
    { title: 'Stress Relief Techniques', url: 'https://www.helpguide.org/articles/stress/stress-management.htm', tag: 'health' },
    { title: 'iCall Student Counseling', url: 'https://icallhelpline.org', tag: 'support' },
  ],
  ideas: [
    { title: 'Startup Ideas for Students', url: 'https://www.ycombinator.com/rfs', tag: 'startup' },
    { title: 'Open Source Projects to Contribute', url: 'https://firstcontributions.github.io', tag: 'opensource' },
    { title: 'Hackathon Calendar India', url: 'https://devfolio.co/hackathons', tag: 'hackathon' },
  ],
  productivity: [
    { title: 'Getting Things Done Summary', url: 'https://hamberg.no/gtd/', tag: 'method' },
    { title: 'Obsidian Note-Taking', url: 'https://obsidian.md', tag: 'tool' },
    { title: 'Google Calendar Tips', url: 'https://calendar.google.com', tag: 'tool' },
  ],
  sos: [
    { title: 'iCall Mental Health Support', url: 'https://icallhelpline.org', tag: 'support' },
    { title: 'Vandrevala Foundation Helpline', url: 'https://www.vandrevalafoundation.com', tag: 'helpline' },
  ],
  talk: [
    { title: 'Random Conversation Starters', url: 'https://conversationstartersworld.com', tag: 'fun' },
    { title: 'Campus Life Hacks', url: 'https://blog.collegedunia.com/campus-life-hacks', tag: 'tips' },
    { title: 'Student Discount Deals', url: 'https://www.isic.org/benefits/', tag: 'deals' },
  ],
};

async function main() {
  console.log('[Seed] Starting database seed...');

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  for (const roomId of ROOMS) {
    const resources = SEED_DATA[roomId] || [];
    for (const resource of resources) {
      await prisma.resource.create({
        data: {
          id: uuidv4(),
          roomId,
          title: resource.title,
          url: resource.url,
          tag: resource.tag,
          pinnedBy: uuidv4(),
          votes: Math.floor(Math.random() * 10) + 1,
          expiresAt: sevenDaysFromNow,
        },
      });
    }
    console.log(`[Seed] Seeded ${resources.length} resources for room: ${roomId}`);
  }

  console.log('[Seed] Done.');
}

main()
  .catch((err) => {
    console.error('[Seed] Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
