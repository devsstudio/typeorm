import {
  DataSource,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { getList as devStudioGetList } from "@devs-studio/nodejsql";

export type ObjectType<T> = { new (): T };

export class DataService<T extends ObjectLiteral> {
  private _type: ObjectType<T>;
  private _repository: Repository<T>;
  private _dataSource: DataSource;

  constructor(
    type: ObjectType<T>,
    repository: Repository<T>,
    dataSource: DataSource
  ) {
    this._type = type;
    this._repository = repository;
    this._dataSource = dataSource;
  }

  private _getManager(transactionManager: EntityManager = null) {
    return transactionManager ? transactionManager : this._repository;
  }

  getList(options: any, transactionManager: EntityManager = null) {
    return devStudioGetList(this._getManager(transactionManager), options);
  }

  async findOne(
    options: FindOneOptions<T>,
    transactionManager: EntityManager = null
  ) {
    return transactionManager
      ? await transactionManager.findOne(this._type, options)
      : await this._repository.findOne(options);
  }

  async find(
    options: FindManyOptions<T>,
    transactionManager: EntityManager = null
  ) {
    return transactionManager
      ? await transactionManager.find(this._type, options)
      : await this._repository.find(options);
  }

  async count(
    options: FindManyOptions<T>,
    transactionManager: EntityManager = null
  ) {
    return transactionManager
      ? await transactionManager.count(this._type, options)
      : await this._repository.count(options);
  }

  async query(
    query: string,
    parameters: any,
    transactionManager: EntityManager = null
  ) {
    return this._getManager(transactionManager).query(query, parameters);
  }

  async bulkInsert(
    items: any[],
    ignore: boolean = false,
    transactionManager: EntityManager = null
  ): Promise<any> {
    const q = this._dataSource
      .createQueryBuilder()
      .insert()
      .into(this._type)
      .values(items);

    var [sql, args] = q.getQueryAndParameters();
    if (ignore) {
      sql = sql.replace("INSERT INTO", "INSERT IGNORE INTO");
    }

    return await this.query(sql, args, transactionManager);
  }
}
