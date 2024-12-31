import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/interfaces/resumeData';
import { formatPhoneNumber } from '@/utils/formatters';

// Register fonts if needed
// Font.register({
//   family: 'Open Sans',
//   src: '/fonts/OpenSans-Regular.ttf'
// });

const styles = StyleSheet.create({
  page: {
    padding: '16px 24px', // Reduced top/bottom padding
    fontFamily: 'Helvetica',
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: '12px', // Reduced from 16px
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1F2937',
  },
  contact: {
    fontSize: 14,
    color: '#4B5563',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  section: {
    marginBottom: '16px', // Reduced from 24px
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '12px', // Reduced from 16px
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'extrabold',
    marginBottom: '4px',
    color: '#2563EB',
  },
  content: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#4B5563',
  },
  jobEntry: {
    marginBottom: '16px',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
    gap: 4,
  },
  jobTitleContainer: {
    flexDirection: 'column',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  jobCompany: {
    fontSize: 14,
    color: '#1F2937',
  },
  jobDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  jobDescription: {
    fontSize: 14,
    marginTop: '8px',
    marginBottom: '12px',
    color: '#1F2937',
    lineHeight: 1.5,
  },
  bulletList: {
    paddingLeft: '16px',
  },
  bullet: {
    fontSize: 14,
    marginBottom: '4px',
    color: '#1F2937',
  },
  educationEntry: {
    marginBottom: '16px',
  },
  skills: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 1.5,
  },
  lastSection: {
    borderBottom: 'none',
    marginBottom: 0,
    paddingBottom: 0,
  },
});

interface PDFTemplateProps {
  data: ResumeData;
}

export const ModernPDFTemplate = ({ data }: PDFTemplateProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.data.fullName}</Text>
        <View style={styles.contact}>
          {data.data.email && <Text>{data.data.email}</Text>}
          {data.data.email && data.data.phone && <Text>•</Text>}
          {data.data.phone && <Text>{formatPhoneNumber(data.data.phone)}</Text>}
        </View>
      </View>

      {/* Summary */}
      {data.data.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.content}>{data.data.summary}</Text>
        </View>
      )}

      {/* Experience */}
      {data.data.jobs && data.data.jobs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.data.jobs.map((job, index) => (
            <View key={index} style={styles.jobEntry}>
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobCompany}>{job.company}</Text>
                </View>
                <Text style={styles.jobDate}>
                  {job.startDate} - {job.endDate || 'Present'}
                </Text>
              </View>
              {job.description && (
                <Text style={styles.jobDescription}>{job.description}</Text>
              )}
              {job.duties && job.duties.length > 0 && (
                <View style={styles.bulletList}>
                  {job.duties.map((duty, dutyIndex) => (
                    <Text key={dutyIndex} style={styles.bullet}>
                      • {duty}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {data.data.education && data.data.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.data.education.map((edu, index) => (
            <View key={index} style={styles.educationEntry}>
              <View style={styles.jobHeader}>
                <View style={styles.jobTitleContainer}>
                  <Text style={styles.jobTitle}>{edu.institution}</Text>
                  {edu.degree && (
                    <Text style={styles.jobCompany}>{edu.degree}</Text>
                  )}
                </View>
                {edu.endDate && (
                  <Text style={styles.jobDate}>Graduated: {edu.endDate}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      {data.data.skills && (
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text style={styles.skills}>
            {data.data.skills.split(',').map((skill, index, array) => 
              `${skill.trim()}${index < array.length - 1 ? ' • ' : ''}`
            ).join('')}
          </Text>
        </View>
      )}
    </Page>
  </Document>
);
