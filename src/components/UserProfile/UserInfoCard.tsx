export default function UserInfoCard({
  firstName,
  lastName,
  email,
  birthDate,
  phone,
  parentName,
  parentPhone,
  enrollmentDate,
  paymentStatus,
}: {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  enrollmentDate: string;
  paymentStatus: string;
}) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {firstName} {lastName}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {email}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Birth Date
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(birthDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {phone}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Parent Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {parentName}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Parent Phone
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {parentPhone}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Enrollment Date
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(enrollmentDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Payment Status
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {paymentStatus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
