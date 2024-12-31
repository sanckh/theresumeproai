import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from '@/interfaces/resumeData';
import { formatPhoneNumber } from '@/utils/formatters';

const styles = StyleSheet.create({
  page: {
    padding: '24px',
    fontFamily: 'Helvetica',
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: '20px',
    textAlign: 'center',
    borderBottom: '1pt solid #000',
    paddingBottom: '16px',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: '8px',
    color: '#000',
  },
  contact: {
    fontSize: 12,
    color: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  section: {
    marginBottom: '16px',
    paddingBottom: '8px',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: '8px',
    color: '#000',
    textTransform: 'uppercase',
    borderBottom: '0.5pt solid #000',
    paddingBottom: '4px',
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#000',
  },
  jobEntry: {
    marginBottom: '12px',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '4px',
  },
  jobTitleContainer: {
    flexDirection: 'column',
  },
  jobTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#000',
  },
  jobCompany: {
    fontSize: 12,
    color: '#000',
  },
  jobDate: {
    fontSize: 11,
    color: '#000',
  },
  jobDescription: {
    fontSize: 11,
    marginTop: '4px',
    marginBottom: '8px',
    color: '#000',
    lineHeight: 1.5,
  },
  bulletList: {
    paddingLeft: '12px',
  },
  bullet: {
    fontSize: 11,
    marginBottom: '2px',
    color: '#000',
  },
  educationEntry: {
    marginBottom: '12px',
  },
  skills: {
    fontSize: 11,
    color: '#000',
    lineHeight: 1.5,
  },
  lastSection: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: 'none',
  },
});

interface PDFTemplateProps {
  data: ResumeData;
}

export const MinimalPDFTemplate = ({ data }: PDFTemplateProps) => (
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
