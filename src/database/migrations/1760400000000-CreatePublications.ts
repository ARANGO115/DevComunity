import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePublications1760400000000 implements MigrationInterface {
  name = 'CreatePublications1760400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`publications\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`content\` text NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`authorId\` int NOT NULL,
        INDEX \`IDX_publications_authorId\` (\`authorId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_publications_author\` FOREIGN KEY (\`authorId\`)
          REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `publications`');
  }
}