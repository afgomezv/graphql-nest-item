import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateItemInput, UpdateItemInput } from './dto/inputs';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}
  async create(createItemInput: CreateItemInput): Promise<Item> {
    const newItem = this.itemRepository.create(createItemInput);
    return await this.itemRepository.save(newItem);
  }

  async findAll(): Promise<Item[]> {
    // Todo: filtrar, paginar, por usuario
    return this.itemRepository.find();
  }

  async findOne(id: string): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) throw new NotFoundException(`Item with id ${id} not found`);

    return item;
  }

  async update(id: string, updateItemInput: UpdateItemInput): Promise<Item> {
    const item = await this.itemRepository.preload(updateItemInput);

    if (!item) throw new NotFoundException(`Item with id ${id} not found`);

    return this.itemRepository.save(item);
  }

  async remove(id: string): Promise<Item> {
    // Todo: soft delete, integrida referencial
    const item = await this.findOne(id);
    await this.itemRepository.remove(item);

    return { ...item, id };
  }
}
