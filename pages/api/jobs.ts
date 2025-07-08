import { NextApiRequest, NextApiResponse } from 'next';
import jsonDb from '../../utils/jsonDb';
import { sendEmail } from '../../utils/emailService';
const { jobConfirmationEmail } = require('../../utils/emailTemplates');

interface EmailTemplate {
  text: string;
  html: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get single job by id
          const jobs = jsonDb.find('jobs', { id: req.query.id });
          
          if (!jobs || jobs.length === 0) {
            return res.status(404).json({ success: false, message: 'Job not found' });
          }
          
          const job = jobs[0];
          
          // Get client information
          let client = null;
          if (job.client_id) {
            const clients = jsonDb.find('clients', { id: job.client_id });
            if (clients && clients.length > 0) {
              client = clients[0];
            }
          }
          
          return res.status(200).json({ 
            success: true, 
            data: { ...job, clients: client }
          });
        }
        
        // Get jobs - filter by clientId if provided
        let jobs = jsonDb.getAll('jobs');
        const clients = jsonDb.getAll('clients');
        
        if (req.query.clientId) {
          jobs = jobs.filter(job => job.client_id === req.query.clientId);
        }
        
        // Sort by date descending
        jobs = jobs.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        });
        
        // Format jobs data to match frontend expectations
        const formattedJobs = jobs.map(job => {
          const client = clients.find(c => c.id === job.client_id);
          return {
            id: job.id,
            clientId: job.client_id,
            clientName: client?.name || 'Unknown Client',
            address: client?.address || '',
            service: job.service,
            date: job.date,
            timeSlot: job.time_slot || '',
            status: job.status,
            notes: job.notes,
            totalAmount: job.total_amount || 0,
            crew: job.crew || [],
            createdAt: job.created_at || job.createdAt,
            updatedAt: job.updated_at || job.updatedAt
          };
        });
        
        return res.status(200).json({ success: true, data: formattedJobs });

      case 'POST':
        // Create a new job
        const newJob = {
          id: `job_${Date.now()}`,
          client_id: req.body.client_id,
          service: req.body.service,
          status: req.body.status || 'Scheduled',
          date: req.body.date,
          description: req.body.description || '',
          total_amount: req.body.total_amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Creating new job:', newJob);
        
        const createdJob = jsonDb.insertOne('jobs', newJob);
        
        // Update client's active_jobs count
        if (newJob.client_id) {
          const clients = jsonDb.find('clients', { id: newJob.client_id });
          if (clients && clients.length > 0) {
            const client = clients[0];
            const activeJobs = (client.active_jobs || 0) + 1;
            jsonDb.updateOne('clients', 'id', newJob.client_id, {
              ...client,
              active_jobs: activeJobs
            });
          }
        }
        
        return res.status(201).json({ 
          success: true, 
          data: createdJob
        });

      case 'PUT':
        // Update a job
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Job ID is required' });
        }
        
        // Get the current job status
        const currentJobs = jsonDb.find('jobs', { id: req.query.id });
        if (!currentJobs || currentJobs.length === 0) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }
        
        const currentJob = currentJobs[0];
        
        const updates = {
          ...req.body,
          updated_at: new Date().toISOString()
        };
        
        const updatedJob = jsonDb.updateOne('jobs', 'id', String(req.query.id), updates);
        
        if (!updatedJob) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // If job status changed to completed, update client's stats and handle recurring jobs
        if (currentJob && 
            currentJob.status !== 'Completed' && 
            updates.status === 'Completed') {
          
          // Update client stats
          if (updates.total_amount && currentJob.client_id) {
            const clients = jsonDb.find('clients', { id: currentJob.client_id });
            if (clients && clients.length > 0) {
              const client = clients[0];
              const completedJobs = (client.completed_jobs || 0) + 1;
              const totalRevenue = (client.total_revenue || 0) + parseFloat(updates.total_amount);
              const activeJobs = Math.max(0, (client.active_jobs || 0) - 1);
              
              jsonDb.updateOne('clients', 'id', currentJob.client_id, {
                ...client,
                completed_jobs: completedJobs,
                total_revenue: totalRevenue,
                active_jobs: activeJobs
              });
            }
          }

          // Handle recurring jobs
          if (currentJob.recurring_type && currentJob.recurring_type !== 'none') {
            // Calculate next occurrence date
            const nextDate = new Date(currentJob.date);
            switch (currentJob.recurring_type) {
              case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case 'biweekly':
                nextDate.setDate(nextDate.getDate() + 14);
                break;
              case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                if (currentJob.recurring_day) {
                  nextDate.setDate(currentJob.recurring_day);
                }
                break;
            }

            // Create next job occurrence
            const newRecurringJob = {
              id: `job_${Date.now()}`,
              client_id: currentJob.client_id,
              service: currentJob.service,
              date: nextDate.toISOString(),
              time_slot: currentJob.time_slot,
              total_amount: currentJob.total_amount,
              crew: currentJob.crew,
              notes: currentJob.notes,
              status: 'Scheduled',
              recurring_type: currentJob.recurring_type,
              recurring_day: currentJob.recurring_day,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            jsonDb.insertOne('jobs', newRecurringJob);

            // Increment client's active jobs count
            if (currentJob.client_id) {
              const clients = jsonDb.find('clients', { id: currentJob.client_id });
              if (clients && clients.length > 0) {
                const client = clients[0];
                const activeJobs = (client.active_jobs || 0) + 1;
                jsonDb.updateOne('clients', 'id', currentJob.client_id, {
                  ...client,
                  active_jobs: activeJobs
                });
              }
            }
          }
        }
        
        return res.status(200).json({ success: true, data: updatedJob });

      case 'DELETE':
        // Delete a job
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Job ID is required' });
        }
        
        // Get the job first to update client stats if needed
        const jobsToDelete = jsonDb.find('jobs', { id: req.query.id });
        if (!jobsToDelete || jobsToDelete.length === 0) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }
        
        const jobToDelete = jobsToDelete[0];
        
        const deleted = jsonDb.deleteOne('jobs', 'id', String(req.query.id));
        
        if (!deleted) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }

        // Update client's active_jobs count if job was active
        if (jobToDelete && 
            jobToDelete.client_id && 
            jobToDelete.status !== 'Completed') {
          const clients = jsonDb.find('clients', { id: jobToDelete.client_id });
          if (clients && clients.length > 0) {
            const client = clients[0];
            const activeJobs = Math.max(0, (client.active_jobs || 0) - 1);
            jsonDb.updateOne('clients', 'id', jobToDelete.client_id, {
              ...client,
              active_jobs: activeJobs
            });
          }
        }
        
        return res.status(200).json({ success: true, message: 'Job deleted successfully' });

      case 'PATCH':
        // Send job confirmation email
        if (!req.query.id) {
          return res.status(400).json({ success: false, message: 'Job ID is required' });
        }
        
        if (!req.body.email) {
          return res.status(400).json({ success: false, message: 'Client email is required' });
        }
        
        const jobsToConfirm = jsonDb.find('jobs', { id: req.query.id });
        if (!jobsToConfirm || jobsToConfirm.length === 0) {
          return res.status(404).json({ success: false, message: 'Job not found' });
        }
        
        const job = jobsToConfirm[0];
        
        // Get client information
        const clientsForJob = jsonDb.find('clients', { id: job.client_id });
        const client = clientsForJob && clientsForJob.length > 0 ? clientsForJob[0] : null;
        
        // Prepare job data for email template
        const jobData = {
          service: job.service,
          date: job.date,
          timeSlot: job.time_slot || 'TBD',
          address: client?.address || 'Your address'
        };
        
        // Generate email content using the job data and client name
        const emailContent = jobConfirmationEmail(
          job.id,
          client?.name || 'Valued Customer',
          job.service,
          {
            date: job.date,
            time: job.time_slot || 'TBD',
            address: client?.address || 'Your address',
            notes: job.notes || ''
          }
        );
        
        try {
          await sendEmail(
            req.body.email,
            `Job Confirmation: ${job.service} on ${job.date}`,
            emailContent.text,
            emailContent.html
          );
          
          return res.status(200).json({ 
            success: true, 
            message: 'Job confirmation email sent successfully' 
          });
        } catch (emailError) {
          console.error('Error sending job confirmation email:', emailError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to send job confirmation email',
            error: String(emailError)
          });
        }

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in jobs API:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: String(error) });
  }
} 