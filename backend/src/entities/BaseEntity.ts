import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Not registered with TypeORM directly (no @Entity decorator) — it's a plain
 * column bag that concrete entities extend via TypeORM's `BaseEntity`-free
 * column inheritance pattern (i.e. each entity re-declares these via mixin).
 * Implemented as an abstract class with decorators so each subclass gets the
 * same id / timestamps without repeating boilerplate.
 */
export abstract class AppBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
