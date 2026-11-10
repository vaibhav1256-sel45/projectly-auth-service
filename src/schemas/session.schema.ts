import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({timestamps:true})
export class Session{
     @Prop({ type: Types.ObjectId, required:true })
     userId: Types.ObjectId;

     @Prop({ type: String, required:true, unique:true })
     sessionId: string;

     @Prop({ type: Boolean, default:false })
     revoked: boolean;

     @Prop({type:Date,required:true})
     expiredAt:Date

}

export const SessionSchema = SchemaFactory.createForClass(Session);
// Mongo removes documents automatically once expiredAt has passed
SessionSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });
