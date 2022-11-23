import {
  EntityManager,
  ObjectLiteral,
  Repository,
} from "typeorm";
import { getList as devStudioGetList } from "@devs-studio/nodejsql";
import { ListParams } from "@devs-studio/nodejsql/dist/dto/params/list.params";

export type ObjectType<T> = { new(): T };

export class DataRepository<T extends ObjectLiteral> extends Repository<T> {
  private _type: ObjectType<T>;

  private _getExecutor(transactionManager?: EntityManager): EntityManager | Repository<T> {
    return transactionManager ? transactionManager : this;
  }

  getList(options: ListParams, transactionManager?: EntityManager) {
    return devStudioGetList(this._getExecutor(transactionManager), options);
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
