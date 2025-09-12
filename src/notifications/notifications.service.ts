import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

export type NotificationUpdates = Partial<
  Pick<Notification, 'offersAndPromotions' | 'ordersStatus'>
>;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>
  ) {}

  async getUserNotifications(userId: string) {
    const objectId = new Types.ObjectId(userId);
    let doc = await this.notificationModel.findOne({ userId: objectId }).exec();
    if (!doc) {
      doc = await this.notificationModel.create({ userId: objectId });
    }
    return {
      userId: doc.userId.toString(),
      offersAndPromotions: doc.offersAndPromotions,
      ordersStatus: doc.ordersStatus,
    };
  }

  async updateUserNotifications(userId: string, updates: NotificationUpdates) {
    const objectId = new Types.ObjectId(userId);
    const updated = await this.notificationModel
      .findOneAndUpdate({ userId: objectId }, { $set: { ...updates } }, { new: true, upsert: true })
      .exec();

    if (!updated) throw new NotFoundException('Unable to update notifications');
    return {
      userId: updated.userId.toString(),
      offersAndPromotions: updated.offersAndPromotions,
      ordersStatus: updated.ordersStatus,
    };
  }
}
