import { Link } from "react-router-dom";
import { Shield, Mail, Building2, Clock } from "lucide-react";

export default function PrivacyPolicy() {
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
            <span className="text-sm text-gray-700">Privacy Policy</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Last updated: September 2026</span>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 text-sm text-gray-700 leading-relaxed">
          <p>
            This Privacy Policy describes how Smart Classroom Hub ("the System", "we", "us")
            collects, uses, and stores personal information of registered users — including
            students, teachers, heads of department, and administrators — when they use this
            internal academic management platform.
          </p>
          <p className="mt-3">
            This system is operated exclusively for institutional use by enrolled students and
            authorised staff. It is not a public-facing product and does not serve external users.
          </p>
        </div>

        <div className="space-y-6">

          {/* Section 1 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>We collect only the information necessary to operate this system:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>Full name, roll number, and institutional email address</li>
                <li>Department, section, and semester assignment</li>
                <li>Attendance records linked to your identity</li>
                <li>Examination marks and grade data entered by teaching staff</li>
                <li>Face encoding data used solely for automated attendance (if enrolled)</li>
                <li>Login session information (IP address, browser type, session timestamps)</li>
                <li>Any messages or queries submitted through the AI Assistant</li>
              </ul>
              <p>
                We do not collect payment information, social media data, or any information
                unrelated to your academic record.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>Your information is used strictly for the following purposes:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>Authenticating your identity when you sign in</li>
                <li>Recording and displaying your attendance and academic marks</li>
                <li>Generating reports for authorised staff (teachers, HOD, administrators)</li>
                <li>Sending academic notifications (timetable changes, exam schedules, alerts)</li>
                <li>Operating the face recognition attendance system, where applicable</li>
                <li>Maintaining system security and audit logs</li>
              </ul>
              <p>
                We do not use your data for advertising, profiling for commercial purposes, or
                any purpose outside the operation of this academic management system.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Face Recognition Data</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                If you enrol in face-based attendance, your facial encoding (a numerical
                representation, not a stored photograph) is saved in the system database. This
                data is:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>Used only to match your presence during attendance sessions</li>
                <li>Accessible only to authorised system administrators</li>
                <li>Deleted upon your account deactivation or at your request</li>
              </ul>
              <p>
                Face enrolment is managed by teaching staff and is not performed automatically
                without your presence.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Data Sharing and Disclosure</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                We do not sell, rent, or share your personal information with any third party for
                commercial purposes. Your data may be accessed by:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>Authorised teaching staff with access to your section or subject</li>
                <li>Heads of department and system administrators within your institution</li>
                <li>The institution's internal IT team responsible for maintaining the system</li>
              </ul>
              <p>
                Data may be disclosed to regulatory or government authorities if required by law,
                and only to the extent mandated.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your academic records, attendance history, and marks are retained for the duration
              of your enrolment and for a reasonable period thereafter, as required by the
              institution's academic record-keeping policy. Session logs are retained for a
              maximum of 90 days. You may request deletion of your account data by contacting
              your institution's system administrator.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Security</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Passwords are stored using industry-standard hashing. Access to data is controlled
              by role-based permissions — students cannot view other students' records, and staff
              can only access data within their authorised scope. All data is transmitted over
              encrypted connections (HTTPS). Despite these measures, no system can guarantee
              absolute security, and you should report any suspected unauthorised access to the
              system administrator immediately.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Your Rights</h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>As a registered user, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5 text-gray-600 ml-1">
                <li>Request a copy of the personal data held about you</li>
                <li>Request correction of inaccurate data (subject to institutional verification)</li>
                <li>Request deletion of your account and associated personal data</li>
              </ul>
              <p>Contact your institution's system administrator to exercise these rights.</p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Changes to This Policy</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We may update this policy when the system's data practices change. The date at the
              top of this page will reflect the most recent revision. Continued use of the system
              after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-blue-50 rounded-xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Mail size={16} className="text-blue-600" />
              <h2 className="text-base font-semibold text-gray-900">Contact</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              For questions about this Privacy Policy or to exercise your data rights, contact
              your institution's system administrator through official internal channels.
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700 font-medium">Back to Sign In</Link>
          <Link to="/terms" className="hover:text-gray-700">Terms of Service</Link>
        </div>

      </div>
    </div>
  );
}
