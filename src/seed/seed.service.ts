import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Item } from 'src/items/entities/item.entity';
import { List } from 'src/lists/entities/list.entity';
import { ListItem } from 'src/list-item/entities/list-item.entity';
import { User } from 'src/users/entities/user.entity';

import { UsersService } from 'src/users/users.service';
import { ItemsService } from 'src/items/items.service';

import { SEED_ITEMS, SEED_lISTS, SEED_USERS } from './data/seed-data';
import { ListsService } from 'src/lists/lists.service';
import { ListItemService } from 'src/list-item/list-item.service';

@Injectable()
export class SeedService {
  private isProduct: boolean;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(ListItem)
    private readonly listItemsRepository: Repository<User>,

    @InjectRepository(List)
    private readonly listsRepository: Repository<User>,

    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
    private readonly listsService: ListsService,
    private readonly listItemService: ListItemService,
  ) {
    this.isProduct = configService.get('STATE') === 'prod';
  }

  async executeSeed() {
    if (this.isProduct) {
      throw new UnauthorizedException('We cannot run SEED on Prod');
    }

    // limpiar la base de datos
    await this.deleteDatase();

    // Crear usuarios
    const user = await this.loadUsers();

    //Crear Items
    await this.itemItems(user);

    //Crear Listas
    const list = await this.loadLists(user);

    //Crear ListItems
    const items = await this.itemsService.findAll(
      user,
      { limit: 12, offset: 0 },
      {},
    );
    await this.loadListItems(list, items);

    return true;
  }

  async deleteDatase() {
    // borrar listItems
    await this.listItemsRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();

    // borrar lists
    await this.listsRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();

    // borrar items
    await this.itemsRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();

    // borrar users
    await this.usersRepository
      .createQueryBuilder()
      .delete()
      .where({})
      .execute();
  }

  async loadUsers(): Promise<User> {
    const users = [];

    for (const user of SEED_USERS) {
      users.push(await this.usersService.create(user));
    }

    return users[0];
  }

  async itemItems(user: User): Promise<void> {
    const items = [];

    for (const item of SEED_ITEMS) {
      items.push(this.itemsService.create(item, user));
    }

    await Promise.all(items);
  }

  async loadLists(user: User): Promise<List> {
    const lists = [];

    for (const list of SEED_lISTS) {
      lists.push(this.listsService.create(list, user));
    }

    return await lists[0];
  }

  async loadListItems(list: List, items: Item[]): Promise<void> {
    const listItems = [];

    for (const item of items) {
      this.listItemService.create({
        quantity: Math.round(Math.random() * 10),
        completed: Math.round(Math.random() * 1) === 0 ? true : false,
        listId: list.id,
        itemId: item.id,
      });
    }
  }
}
