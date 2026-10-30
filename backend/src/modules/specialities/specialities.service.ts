import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Speciality, SpecialityDocument } from './schemas/speciality.schema';

@Injectable()
export class SpecialitiesService {
  constructor(@InjectModel(Speciality.name) private model: Model<Speciality>) {}

  async findAllActive(): Promise<SpecialityDocument[]> {
    return this.model.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).exec();
  }

  async findById(id: string): Promise<SpecialityDocument | null> {
    return this.model.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<SpecialityDocument[]> {
    if (!ids.length) return [];
    return this.model.find({ _id: { $in: ids }, isActive: true }).exec();
  }

  async create(data: { name: string; category: string; icon?: string; color?: string; description?: string }): Promise<SpecialityDocument> {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await this.model.findOne({ $or: [{ name: data.name }, { slug }] }).exec();
    if (existing) throw new ConflictException('Speciality already exists');
    return this.model.create({ ...data, slug });
  }

  async update(id: string, data: Partial<{ name: string; category: string; icon: string; color: string; description: string; sortOrder: number; isActive: boolean }>): Promise<SpecialityDocument> {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!doc) throw new NotFoundException('Speciality not found');
    return doc;
  }

  async deactivate(id: string): Promise<void> {
    const doc = await this.model.findByIdAndUpdate(id, { isActive: false }).exec();
    if (!doc) throw new NotFoundException('Speciality not found');
  }

  async seedIfEmpty(): Promise<number> {
    const count = await this.model.countDocuments().exec();
    if (count > 0) return count;

    const items = [
      { name: 'Muratore', category: 'edilizia', icon: 'mason', color: '#b45309' },
      { name: 'Saldatore', category: 'meccanica', icon: 'welding', color: '#dc2626' },
      { name: "Meccanico d'auto", category: 'automotive', icon: 'car-wrench', color: '#ea580c' },
      { name: 'Elettricista', category: 'elettrica', icon: 'electrician', color: '#eab308' },
      { name: 'Idraulico', category: 'artigianato', icon: 'pipe', color: '#0891b2' },
      { name: 'Cartongessista', category: 'edilizia', icon: 'drywall', color: '#a3a3a3' },
      { name: 'Falegname', category: 'artigianato', icon: 'carpenter', color: '#92400e' },
      { name: 'Imbianchino', category: 'edilizia', icon: 'paint-roller', color: '#f59e0b' },
      { name: 'Carrozziere', category: 'automotive', icon: 'car-body', color: '#7c3aed' },
      { name: 'Serramentista', category: 'artigianato', icon: 'window', color: '#64748b' },
      { name: 'Carpentiere edile', category: 'edilizia', icon: 'formwork', color: '#ca8a04' },
      { name: 'Escavatorista', category: 'edilizia', icon: 'excavator', color: '#d97706' },
      { name: 'Meccanico industriale', category: 'industriale', icon: 'gear', color: '#475569' },
      { name: 'Manutentore industriale', category: 'industriale', icon: 'settings', color: '#334155' },
      { name: 'Giuntista fibra ottica', category: 'elettrica', icon: 'fiber', color: '#06b6d4' },
      { name: 'Operaio specializzato', category: 'generico', icon: 'worker', color: '#2563eb' },
      { name: 'Aiuto muratore', category: 'edilizia', icon: 'mason-helper', color: '#c2410c' },
      { name: 'Apprendista', category: 'generico', icon: 'graduate', color: '#16a34a' },
      { name: 'Operaio edile', category: 'edilizia', icon: 'helmet', color: '#f97316' },
      { name: 'Montatore metalmeccanico', category: 'industriale', icon: 'assembly', color: '#6366f1' },
      { name: 'Verniciatore', category: 'automotive', icon: 'spray', color: '#ec4899' },
      { name: 'Elettricista industriale', category: 'industriale', icon: 'bolt', color: '#facc15' },
      { name: 'Manovale', category: 'generico', icon: 'handyman', color: '#78716c' },
      { name: 'Tornitore CNC', category: 'industriale', icon: 'cnc', color: '#14b8a6' },
    ];

    const docs = items.map((it, i) => ({
      ...it,
      slug: it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      sortOrder: i,
    }));

    await this.model.insertMany(docs);
    return docs.length;
  }
}