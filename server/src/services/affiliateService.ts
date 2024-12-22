import { AffiliateRequest } from "../interfaces/afilliateInterface";
import { db } from "../../firebase_options";

export const createAffiliate = async (data: AffiliateRequest): Promise<AffiliateRequest> => {
  try {
    const docRef = await db.collection('affiliateRequests').add({
      name: data.name,
      email: data.email,
      phone: data.phone,
      status: data.status,
      createdAt: data.createdAt
    });

    return {
      id: docRef.id,
      ...data
    };
  } catch (error) {
    console.error('Error creating affiliate request:', error);
    throw error;
  }
};

export const findAffiliateByEmail = async (email: string): Promise<AffiliateRequest | null> => {
  try {
    const querySnapshot = await db.collection('affiliateRequests')
      .where('email', '==', email)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as AffiliateRequest;
  } catch (error) {
    console.error('Error finding affiliate request:', error);
    throw error;
  }
};
