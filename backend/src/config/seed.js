require('dotenv').config();
const { pool } = require('./database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function seed() {
  const client = await pool.connect();
  try {
    logger.info('Seeding database...');

    // Seed grades (Grade R to Grade 12)
    const grades = [
      { name: 'Grade R', level: 0, description: 'Foundation Phase - Reception Year' },
      { name: 'Grade 1', level: 1, description: 'Foundation Phase' },
      { name: 'Grade 2', level: 2, description: 'Foundation Phase' },
      { name: 'Grade 3', level: 3, description: 'Foundation Phase' },
      { name: 'Grade 4', level: 4, description: 'Intermediate Phase' },
      { name: 'Grade 5', level: 5, description: 'Intermediate Phase' },
      { name: 'Grade 6', level: 6, description: 'Intermediate Phase' },
      { name: 'Grade 7', level: 7, description: 'Senior Phase' },
      { name: 'Grade 8', level: 8, description: 'Senior Phase' },
      { name: 'Grade 9', level: 9, description: 'Senior Phase' },
      { name: 'Grade 10', level: 10, description: 'Further Education and Training (FET) Phase' },
      { name: 'Grade 11', level: 11, description: 'Further Education and Training (FET) Phase' },
      { name: 'Grade 12', level: 12, description: 'Further Education and Training (FET) Phase - Matric' },
    ];

    for (const grade of grades) {
      await client.query(
        `INSERT INTO grades (name, level, description) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [grade.name, grade.level, grade.description]
      );
    }

    // Seed subjects
    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Core mathematics curriculum' },
      { name: 'Mathematical Literacy', code: 'MATLIT', description: 'Mathematical literacy for practical applications' },
      { name: 'English Home Language', code: 'ENGHL', description: 'English as a home language' },
      { name: 'English First Additional Language', code: 'ENGFAL', description: 'English as first additional language' },
      { name: 'Afrikaans Home Language', code: 'AFKHL', description: 'Afrikaans as a home language' },
      { name: 'Afrikaans First Additional Language', code: 'AFKFAL', description: 'Afrikaans as first additional language' },
      { name: 'Life Skills', code: 'LIFESK', description: 'Life skills and orientation' },
      { name: 'Life Orientation', code: 'LO', description: 'Life orientation' },
      { name: 'Natural Sciences', code: 'NATSCI', description: 'Natural sciences' },
      { name: 'Social Sciences', code: 'SOCSCI', description: 'Social sciences - History and Geography' },
      { name: 'Technology', code: 'TECH', description: 'Technology' },
      { name: 'Economic and Management Sciences', code: 'EMS', description: 'Economic and management sciences' },
      { name: 'Arts and Culture', code: 'ARTCUL', description: 'Arts and culture' },
      { name: 'Creative Arts', code: 'CREART', description: 'Creative arts' },
      { name: 'Physical Sciences', code: 'PHYSCI', description: 'Physics and Chemistry' },
      { name: 'Life Sciences', code: 'LIFESCI', description: 'Biology and life sciences' },
      { name: 'Geography', code: 'GEO', description: 'Geography' },
      { name: 'History', code: 'HIST', description: 'History' },
      { name: 'Accounting', code: 'ACC', description: 'Accounting' },
      { name: 'Business Studies', code: 'BUS', description: 'Business studies' },
      { name: 'Economics', code: 'ECON', description: 'Economics' },
      { name: 'Computer Applications Technology', code: 'CAT', description: 'Computer applications technology' },
      { name: 'Information Technology', code: 'IT', description: 'Information technology' },
      { name: 'Agricultural Sciences', code: 'AGRI', description: 'Agricultural sciences' },
    ];

    for (const subject of subjects) {
      await client.query(
        `INSERT INTO subjects (name, code, description) VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [subject.name, subject.code, subject.description]
      );
    }

    // Create default admin user. IMPORTANT: Change this password immediately after first login.
    const adminPassword = await bcrypt.hash('Admin@123456', 12);
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@schoolmate101.co.za', adminPassword, 'System Administrator', 'admin']
    );

    logger.info('Database seeded successfully.');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
