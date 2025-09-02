import { Patient } from '../types/types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 28,
    nextVisit: '2025-01-10',
    lastVisit: '2024-12-15',
    patientSince: '2023-03-20',
    primaryConcern: 'Anxiety Disorders',
    status: 'active',
    lastVisitSummary: 'Patient showed significant improvement in managing anxiety triggers through breathing exercises. We discussed upcoming social situations and practiced coping strategies for holiday gatherings.',
    contactInfo: {
      phone: '(555) 123-4567',
      email: 'sarah.j@email.com'
    }
  },
  {
    id: '2',
    name: 'Michael Chen',
    age: 35,
    nextVisit: '2025-01-08',
    lastVisit: '2024-12-10',
    patientSince: '2022-11-15',
    primaryConcern: 'PTSD',
    status: 'active',
    lastVisitSummary: 'Completed EMDR session focusing on recent trauma memory that has been causing nightmares. Patient reported feeling less activated when discussing the incident and plans to practice grounding techniques.',
    contactInfo: {
      phone: '(555) 234-5678',
      email: 'mchen@email.com'
    }
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    age: 42,
    nextVisit: '2025-01-12',
    lastVisit: '2024-12-18',
    patientSince: '2021-07-08',
    primaryConcern: 'Depression',
    status: 'active',
    lastVisitSummary: 'Patient expressed feeling more motivated and engaged in daily activities since adjusting medication dosage. We reviewed her mood tracking log and discussed maintaining her new exercise routine.',
    contactInfo: {
      phone: '(555) 345-6789',
      email: 'e.rodriguez@email.com'
    }
  },
  {
    id: '4',
    name: 'David Thompson',
    age: 31,
    nextVisit: null,
    lastVisit: '2024-11-22',
    patientSince: '2024-01-10',
    primaryConcern: 'Social Phobia',
    status: 'paused',
    lastVisitSummary: 'Patient requested a break from therapy to focus on work commitments but acknowledged progress made in group settings. Agreed to resume sessions after the holidays with continued homework assignments.',
    contactInfo: {
      phone: '(555) 456-7890'
    }
  },
  {
    id: '5',
    name: 'Jessica Wong',
    age: 29,
    nextVisit: '2025-01-15',
    lastVisit: '2024-12-20',
    patientSince: '2023-09-05',
    primaryConcern: 'Panic Disorder',
    status: 'active',
    lastVisitSummary: 'Excellent progress in recognizing early warning signs of panic attacks before they escalate. Patient successfully used the 5-4-3-2-1 grounding technique during a recent episode at work.',
    contactInfo: {
      phone: '(555) 567-8901',
      email: 'jwong@email.com'
    }
  },
  {
    id: '6',
    name: 'Robert Martinez',
    age: 38,
    nextVisit: '2025-01-14',
    lastVisit: '2024-12-12',
    patientSince: '2022-05-18',
    primaryConcern: 'OCD',
    status: 'active',
    lastVisitSummary: 'Patient completed another successful exposure exercise without performing compulsive checking behaviors. We reviewed his progress chart and planned more challenging exposures for the next session.',
    contactInfo: {
      phone: '(555) 678-9012',
      email: 'rmartinez@email.com'
    }
  }
];
