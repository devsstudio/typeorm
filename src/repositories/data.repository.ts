import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectLiteral,
  QueryRunner,
  Repository,
  SaveOptions,
  SelectQueryBuilder,
} from "typeorm";
import { getList as devStudioGetList } from "@devs-studio/nodejsql";
import { ListParams } from "@devs-studio/nodejsql/dist/dto/params/list.params";

export interface PureInsertOptions {
  insertIdAt?: string,
  updateEntity?: boolean
}

export interface PureInsertReturningOptions {
  returning?: string[],
  updateEntity?: boolean
}

export type ObjectType<T extends ObjectLiteral> = { new(): T };

export class DataRepository<T extends ObjectLiteral> extends Repository<T> {
  private _type: ObjectType<T>;

  constructor(type: ObjectType<T>, manager: EntityManager, queryRunner?: QueryRunner) {
    super(type, manager, queryRunner);
    this._type = type;
  }

  private _getExecutor(transactionManager?: EntityManager): EntityManager {
    return transactionManager ? transactionManager : this.manager;
  }

  generateListParams(timezoneOffset: number): ListParams {
    return null;
  }

  getList(options: ListParams, transactionManager?: EntityManager) {
    return devStudioGetList(this._getExecutor(transactionManager), options);
  }

  async findOne(
    options?: FindOneOptions<T>,
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.findOne(this._type, options)
      : await super.findOne(options);
  }

  async findOneBy(
    options?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.findOneBy(this._type, options)
      : await super.findOneBy(options);
  }

  async find(
    options?: FindManyOptions<T>,
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.find(this._type, options)
      : await super.find(options);
  }

  async findBy(
    options?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.findBy(this._type, options)
      : await super.findBy(options);
  }

  async count(
    options?: FindManyOptions<T>,
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.count(this._type, options)
      : await super.count(options);
  }

  async countBy(
    options?: FindOptionsWhere<T>,
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.countBy(this._type, options)
      : await super.countBy(options);
  }

  async saveFromPartial(partial: DeepPartial<T>, options?: SaveOptions, transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.save(partial, options)
      : await super.save(partial, options);
  }

  async insertFromPartial(partial: DeepPartial<T>, transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.insert(this._type, partial)
      : await super.insert(partial);
  }

  async insert(partial: DeepPartial<T>, transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.insert(this._type, partial)
      : await super.insert(partial);
  }

  async update(criteria: string | number | FindOptionsWhere<T> | Date | string[] | number[] | Date[], partial: DeepPartial<T>, transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.update(this._type, criteria, partial)
      : await super.update(criteria, partial);
  }

  /**
   * Use for MySQL, MariaDB
   * @param partial 
   * @param options 
   * @param transactionManager 
   * @returns 
   */
  async pureInsert(partial: DeepPartial<T>, options?: PureInsertOptions, transactionManager?: EntityManager) {
    var qb = this._getExecutor(transactionManager)
      .createQueryBuilder()
      .insert()
      .into(this._type)
      .values(partial);
    //updateEntity cuando es true generá un select después del insert
    if (options?.updateEntity !== undefined && options.updateEntity !== null) {
      qb.updateEntity(options.updateEntity);
    }

    var results = await qb.execute();
    //Cuando insertIdAt es true asignará el insertId a la propiedad especificada
    if (options?.insertIdAt !== undefined && options.insertIdAt !== null) {
      type ObjectKey = keyof typeof partial;
      const myVar = options.insertIdAt as ObjectKey;
      partial[myVar] = results.raw["insertId"];
    }

    return results;
  }

  /**
   * Use for SQL Server, Postgres
   * @param partial 
   * @param options 
   * @param transactionManager 
   * @returns 
   */
  async pureInsertReturning(partial: DeepPartial<T>, options?: PureInsertReturningOptions, transactionManager?: EntityManager) {
    var qb = this._getExecutor(transactionManager)
      .createQueryBuilder()
      .insert()
      .into(this._type)
      .values(partial);
    //updateEntity cuando es true generá un select después del insert
    if (options?.updateEntity !== undefined && options.updateEntity !== null) {
      qb.updateEntity(options.updateEntity);
    }
    if (options?.returning !== undefined && options.returning.length > 0) {
      qb.returning(options.returning);
    }

    var results = await qb.execute();
    //Cuando insertIdAt es true asignará el insertId a la propiedad especificada
    if (results.raw?.length > 0 && options?.returning !== undefined && options.returning.length > 0) {
      for (let [column, returned] of Object.entries<any>(results.raw[0])) {
        if (options.returning.includes(column)) {
          type ObjectKey = keyof typeof partial;
          const myVar = column as ObjectKey;
          partial[myVar] = returned;
        }
      }
    }

    return results;
  }

  async bulkInsert(
    items: Partial<T>[],
    ignore: boolean = false,
    transactionManager?: EntityManager
  ): Promise<any> {
    const q = this
      .createQueryBuilder()
      .insert()
      .into(this._type)
      .values(items);

    var [sql, args] = q.getQueryAndParameters();
    if (ignore) {
      sql = sql.replace("INSERT INTO", "INSERT IGNORE INTO");
    }

    return await this._getExecutor(transactionManager).query(sql, args);
  }

  async delete(criteria: string | number | Date | string[] | number[] | Date[] | FindOptionsWhere<T>, transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.delete(this._type, criteria)
      : await super.delete(criteria);
  }

  async query(sql: string, parameters: any[], transactionManager?: EntityManager) {
    if (transactionManager) {
      return await transactionManager.query(sql, parameters);
    } else {
      return await super.query(sql, parameters);
    }
  }

  createQueryBuilder(alias?: string, queryRunner?: QueryRunner, transactionManager?: EntityManager): SelectQueryBuilder<T> {
    return transactionManager ? transactionManager.createQueryBuilder(this._type, alias, this.queryRunner) : super.createQueryBuilder(alias, queryRunner);
  }
}
