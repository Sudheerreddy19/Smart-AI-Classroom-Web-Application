import { Link } from "react-router-dom";
import { FileText, Clock } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              Smart Classroom Hub
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-700">Terms of Service</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Last updated: September 2026</span>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-sm text-gray-700 leading-relaxed">
          <p>
            These Terms of Service govern your access to and use of Smart Classroom Hub (the
            "System"), an internal academic management platform operated for the exclusive use
            of enrolled students and authorised staff of the institution.
          </p>
          <p className="mt-3">
            By creating an account or logging in, you confirm that you have read, understood, and
            agree to these terms. If you do not agree, do not access or use the System.
          </p>
        </div>

        <div className="space-y-6">

          {/* Section 1 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Eligibility and Account Access</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                Access to the System is restricted to individuals who have been registered by the
                institution — either as a student (with a valid roll number), teacher, head of
                department, or administrator.
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>You may not share your login credentials with any other person.</li>
                <li>You are responsible for all activity that occurs under your account.</li>
                <li>You must notify the system administrator immediately if you suspect
                    unauthorised use of your account.</li>
                <li>Accounts belong to the institution; access is granted for academic purposes
                    only and may be revoked at any time.</li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Acceptable Use</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>You agree to use the System only for its intended academic purposes. You must not:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>Attempt to access data, accounts, or system components you are not authorised to access.</li>
                <li>Interfere with or disrupt the operation of the System or its underlying infrastructure.</li>
                <li>Introduce malicious software, scripts, or automated bots.</li>
                <li>Submit false or misleading information, including attendance or mark data.</li>
                <li>Use the AI Assistant to generate or distribute inappropriate, harmful, or
                    misleading content.</li>
                <li>Reverse-engineer, decompile, or attempt to extract source code from the System.</li>
                <li>Use the System or any data obtained from it for commercial purposes.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Academic Data Integrity</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Attendance records and marks entered into the System carry the same weight as
              official academic records. Any attempt to manipulate, falsify, or tamper with
              these records — whether by a student or staff member — constitutes a breach of
              these terms and may result in disciplinary action under the institution's academic
              integrity policy, in addition to account suspension.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Face Recognition Attendance</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                If you participate in face-based attendance, you consent to the capture and
                storage of your facial encoding for identity verification during attendance
                sessions within the System. You understand that:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>This data is used solely for verifying your attendance.</li>
                <li>You may request removal of this data at any time by contacting the administrator.</li>
                <li>Attempting to deceive or circumvent face verification is a breach of these terms.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. AI Assistant</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                The AI Assistant is provided as an academic aid. You acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>Responses generated by the AI are not guaranteed to be accurate and should
                    not replace authoritative academic sources or instructor guidance.</li>
                <li>Conversations may be logged for quality assurance and system improvement
                    purposes, in accordance with our Privacy Policy.</li>
                <li>You must not use the AI Assistant to produce academic work that you
                    misrepresent as your own, in violation of the institution's academic integrity policy.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              The System, including its interface, code, and structure, is the property of the
              institution and its development team. Your academic data remains yours. You do not
              acquire any ownership interest in the System by using it. Downloading or copying
              the System's code, design, or content without explicit written permission is
              prohibited.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Availability and Changes</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We make reasonable efforts to keep the System available. However, scheduled
              maintenance, infrastructure issues, or unforeseen circumstances may cause downtime.
              We reserve the right to modify, update, or discontinue features of the System at
              any time, with or without prior notice. We will make reasonable efforts to communicate
              significant changes through in-system notifications.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Account Suspension and Termination</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Accounts may be suspended or permanently terminated for violation of these terms,
              at the discretion of the system administrator or institution. Graduated students,
              teachers, or staff who have left the institution will have their accounts deactivated
              following the institution's offboarding procedure. You may request account deletion
              at any time.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              The System is provided for internal academic purposes. To the extent permitted by
              applicable law, we are not liable for any indirect, incidental, or consequential
              damages arising from your use of or inability to use the System. This includes
              data loss due to hardware failure, connectivity issues, or security incidents
              beyond our reasonable control.
            </p>
          </section>

          {/* Section 10 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Changes to These Terms</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We may revise these Terms from time to time. The date shown at the top of this
              page reflects the most recent update. Your continued use of the System after the
              revised terms are posted constitutes your acceptance of the changes.
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700 font-medium">Back to Sign In</Link>
          <Link to="/privacy" className="hover:text-gray-700">Privacy Policy</Link>
        </div>

      </div>
    </div>
  );
}
