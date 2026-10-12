import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndRoles1760300000000 implements MigrationInterface {
  name = 'CreateUsersAndRoles1760300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` enum('ADMIN','MODERADOR','USUARIO') NOT NULL,
        UNIQUE INDEX \`IDX_roles_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(100) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`roleId\` int NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_users_role\` FOREIGN KEY (\`roleId\`)
          REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `users`');
    await queryRunner.query('DROP TABLE `roles`');
  }
}
