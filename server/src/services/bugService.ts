import { db } from "../../firebase_options";
import { BugReport } from "../interfaces/bugReport";



  export const createBugReport = async (bugReport: BugReport): Promise<BugReport> => {
    try {
      const docRef = await db.collection('bug_reports').add({
        userId: bugReport.userId,
        title: bugReport.title,
        description: bugReport.description,
        status: bugReport.status,
        createdAt: bugReport.createdAt || new Date(),
      });

      return {
        id: docRef.id,
        ...bugReport,
      };
    } catch (error) {
      console.error('Error creating bug report:', error);
      throw new Error('Failed to create bug report');
    }
  }

  export const getBugReports = async (): Promise<BugReport[]> => {
    try {
      const snapshot = await db.collection('bug_reports')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          title: data.title,
          description: data.description,
          status: data.status,
          createdAt: new Date(data.createdAt),
        } as BugReport;
      });
    } catch (error) {
      console.error('Error fetching bug reports:', error);
      throw new Error('Failed to fetch bug reports');
    }
  }
