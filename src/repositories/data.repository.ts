import {
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  QueryRunner,
  Repository,
} from "typeorm";
import { getList as devStudioGetList } from "@devs-studio/nodejsql";
import { ListParams } from "@devs-studio/nodejsql/dist/dto/params/list.params";

export type ObjectType<T> = { new(): T };

export class DataRepository<T extends ObjectLiteral> extends Repository<T> {
  private _type: ObjectType<T>;

  constructor(type: ObjectType<T>, manager: EntityManager, queryRunner?: QueryRunner) {
    super(type, manager, queryRunner);
    this._type = type;
  }

  private _getExecutor(transactionManager?: EntityManager): EntityManager | Repository<T> {
    return transactionManager ? transactionManager : this.manager;
  }

  getList(options: ListParams, transactionManager?: EntityManager) {
    return devStudioGetList(this._getExecutor(transactionManager), options);
  }

  async findOne(
    options: FindOneOptions<T>,
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.findOne(this._type, options)
      : await super.findOne(options);
  }

  async find(
    options: FindManyOptions<T>,
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.find(this._type, options)
      : await super.find(options);
  }

  async count(
    options: FindManyOptions<T>,
    transactionManager?: EntityManager
  ) {
    return transactionManager
      ? await transactionManager.count(this._type, options)
      : await super.count(options);
  }

  async query(
    query: string,
    parameters: any,
    transactionManager?: EntityManager
  ) {
    return this._getExecutor(transactionManager).query(query, parameters);
  }

  async bulkInsert(
    items: any[],
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
}
