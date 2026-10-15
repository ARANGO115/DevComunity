import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePublicationsCommentsAndReactions1760400000000
  implements MigrationInterface
{
  name = 'CreatePublicationsCommentsAndReactions1760400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`publicaciones\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`content\` text NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`authorId\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_publicaciones_author\` FOREIGN KEY (\`authorId\`)
          REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`comentarios\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`content\` text NOT NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`authorId\` int NOT NULL,
        \`publicationId\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_comentarios_author\` FOREIGN KEY (\`authorId\`)
          REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_comentarios_publication\` FOREIGN KEY (\`publicationId\`)
          REFERENCES \`publicaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE TABLE \`reacciones\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`userId\` int NOT NULL,
        \`publicationId\` int NOT NULL,
        UNIQUE INDEX \`UQ_reacciones_user_publication\` (\`userId\`, \`publicationId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_reacciones_user\` FOREIGN KEY (\`userId\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_reacciones_publication\` FOREIGN KEY (\`publicationId\`)
          REFERENCES \`publicaciones\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `reacciones`');
    await queryRunner.query('DROP TABLE `comentarios`');
    await queryRunner.query('DROP TABLE `publicaciones`');
  }
}
