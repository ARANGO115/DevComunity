import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateComments1760600000000 implements MigrationInterface {
  name = "CreateComments1760600000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`comments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`content\` varchar(2000) NOT NULL,
        \`publicationId\` int NOT NULL,
        \`authorId\` int NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`IDX_comments_publication_createdAt\` (\`publicationId\`, \`createdAt\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_comments_author\` FOREIGN KEY (\`authorId\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE `comments`");
  }
}
