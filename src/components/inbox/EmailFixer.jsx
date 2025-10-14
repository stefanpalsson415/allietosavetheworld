import React, { useState } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useFamily } from '../../contexts/FamilyContext';
import { Mail, AlertCircle, CheckCircle, Search } from 'lucide-react';

const EmailFixer = () => {
  const { familyId } = useFamily();
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const runDiagnostics = async () => {
    setShowDiagnostics(true);
    setDiagnostics({ loading: true });
    
    try {
      const diag = {
        familyId: familyId,
        totalEmailsInDb: 0,
        palssonEmails: [],
        familyEmails: [],
        wrongFamilyEmails: [],
        allEmails: []
      };
      
      // Get all emails
      const allEmailsQuery = query(collection(db, 'emailInbox'));
      const snapshot = await getDocs(allEmailsQuery);
      
      diag.totalEmailsInDb = snapshot.size;
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const emailInfo = {
          id: docSnap.id,
          to: data.to,
          from: data.from,
          subject: data.subject,
          familyId: data.familyId,
          familyEmailPrefix: data.familyEmailPrefix,
          receivedAt: data.receivedAt
        };
        
        diag.allEmails.push(emailInfo);
        
        // Check different conditions
        if (data.to && (
            data.to.includes('palsson@') || 
            data.to.toLowerCase().includes('palsson') ||
            data.familyEmailPrefix === 'palsson'
        )) {
          diag.palssonEmails.push(emailInfo);
          if (data.familyId !== familyId) {
            diag.wrongFamilyEmails.push(emailInfo);
          }
        }
        
        if (data.familyId === familyId) {
          diag.familyEmails.push(emailInfo);
        }
      });
      
      // Check family document
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      if (familyDoc.exists()) {
        diag.familyData = familyDoc.data();
      }
      
      setDiagnostics(diag);
    } catch (error) {
      setDiagnostics({ error: error.message });
    }
  };
  
  const fixEmails = async () => {
    setFixing(true);
    setResult(null);
    
    try {
      console.log('🔧 Starting comprehensive email fix for family:', familyId);
      
      // Step 1: Update family document
      const familyRef = doc(db, 'families', familyId);
      await updateDoc(familyRef, {
        emailPrefix: 'palsson',
        email: 'palsson@families.checkallie.com',
        emailDomain: '@families.checkallie.com',
        emailUpdatedAt: new Date()
      });
      
      // Step 2: Find ALL emails in the database
      const allEmailsQuery = query(collection(db, 'emailInbox'));
      const snapshot = await getDocs(allEmailsQuery);
      
      console.log(`Found ${snapshot.size} total emails in database`);
      
      let totalEmails = 0;
      let updatedEmails = 0;
      const emailsToUpdate = [];
      const allEmailDetails = [];
      
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        
        // Log each email for debugging
        allEmailDetails.push({
          id: docSnap.id,
          to: data.to,
          from: data.from,
          subject: data.subject,
          familyId: data.familyId
        });
        
        // More comprehensive check for palsson emails
        const isPalssonEmail = 
          (data.to && (
            data.to.toLowerCase().includes('palsson') ||
            data.to.includes('palsson@families.checkallie.com') ||
            data.to.includes('palsson@checkallie.com') ||
            data.to.includes('palsson@allie.family')
          )) ||
          data.familyEmailPrefix === 'palsson' ||
          (data.subject && (
            data.subject.includes('CHECK CHECK') ||
            data.subject.includes('Test Email')
          )) ||
          (data.from && data.from.includes('stefan@stefanpalsson.com'));
        
        if (isPalssonEmail) {
          totalEmails++;
          console.log('Found palsson email:', data.subject, 'current familyId:', data.familyId);
          
          if (data.familyId !== familyId) {
            emailsToUpdate.push({
              id: docSnap.id,
              subject: data.subject,
              from: data.from,
              currentFamilyId: data.familyId
            });
          }
        }
      });
      
      console.log('All emails in database:', allEmailDetails);
      console.log('Emails to update:', emailsToUpdate);
      
      // Step 3: Update emails
      if (emailsToUpdate.length > 0) {
        for (const email of emailsToUpdate) {
          console.log(`Updating email "${email.subject}" from family ${email.currentFamilyId} to ${familyId}`);
          await updateDoc(doc(db, 'emailInbox', email.id), {
            familyId: familyId,
            familyEmailPrefix: 'palsson'
          });
          updatedEmails++;
        }
      }
      
      // Clear cache
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('email') || key.includes('family'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log('Clearing cache:', key);
        localStorage.removeItem(key);
      });
      
      // Ensure current family ID is set
      localStorage.setItem('currentFamilyId', familyId);
      
      setResult({
        success: true,
        totalEmails,
        updatedEmails,
        message: `Found ${totalEmails} palsson emails. Updated ${updatedEmails} to your family.`,
        allEmailsCount: snapshot.size
      });
      
      // Only reload if we actually updated something
      if (updatedEmails > 0) {
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error fixing emails:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setFixing(false);
    }
  };
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">Email Configuration Issue</h3>
          <p className="text-sm text-gray-700 mb-3">
            Your emails may not be showing correctly. Use the diagnostic tool to investigate.
          </p>
          
          <div className="flex gap-2 mb-3">
            <button
              onClick={runDiagnostics}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Run Diagnostics
            </button>
            
            <button
              onClick={fixEmails}
              disabled={fixing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              {fixing ? 'Fixing emails...' : 'Fix Email Configuration'}
            </button>
          </div>
          
          {result && (
            <div className={`mt-3 p-3 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-start gap-2">
                {result.success ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                <div>
                  {result.success ? (
                    <>
                      <div className="font-medium">{result.message}</div>
                      {result.allEmailsCount !== undefined && (
                        <div className="text-sm mt-1">Total emails in database: {result.allEmailsCount}</div>
                      )}
                      {result.updatedEmails > 0 && (
                        <div className="text-sm mt-1">Page will reload in a moment...</div>
                      )}
                    </>
                  ) : (
                    <div className="font-medium">Error: {result.error}</div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {showDiagnostics && diagnostics && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
              <h4 className="font-semibold mb-2">Email Diagnostics</h4>
              
              {diagnostics.loading ? (
                <p>Running diagnostics...</p>
              ) : diagnostics.error ? (
                <p className="text-red-600">Error: {diagnostics.error}</p>
              ) : (
                <div className="space-y-2">
                  <div>Your Family ID: <code className="bg-gray-200 px-1 rounded">{diagnostics.familyId}</code></div>
                  <div>Total emails in database: <strong>{diagnostics.totalEmailsInDb}</strong></div>
                  <div>Emails for your family: <strong>{diagnostics.familyEmails.length}</strong></div>
                  <div>Palsson emails found: <strong>{diagnostics.palssonEmails.length}</strong></div>
                  <div>Palsson emails with wrong family ID: <strong>{diagnostics.wrongFamilyEmails.length}</strong></div>
                  
                  {diagnostics.familyData && (
                    <div className="mt-3 p-2 bg-white rounded">
                      <div className="font-medium mb-1">Your Family Settings:</div>
                      <div className="text-xs space-y-1">
                        <div>Email: {diagnostics.familyData.email || 'Not set'}</div>
                        <div>Email Prefix: {diagnostics.familyData.emailPrefix || 'Not set'}</div>
                        <div>Name: {diagnostics.familyData.name}</div>
                      </div>
                    </div>
                  )}
                  
                  {diagnostics.allEmails.length > 0 && (
                    <div className="mt-3">
                      <div className="font-medium mb-1">All Emails in Database:</div>
                      <div className="max-h-48 overflow-y-auto bg-white p-2 rounded text-xs">
                        {diagnostics.allEmails.map((email, idx) => (
                          <div key={idx} className="border-b py-1">
                            <div>To: {email.to || 'N/A'}</div>
                            <div>Subject: {email.subject}</div>
                            <div>Family ID: {email.familyId}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailFixer;