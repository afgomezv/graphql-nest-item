import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from 'src/items/entities/item.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ItemsService } from 'src/items/items.service';

import { SEED_ITEMS, SEED_USERS } from './data/seed-data';

@Injectable()
export class SeedService {
  private isProduct: boolean;

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    private readonly usersService: UsersService,
    private readonly itemsService: ItemsService,
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

    return true;
  }

  async deleteDatase() {
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
}
