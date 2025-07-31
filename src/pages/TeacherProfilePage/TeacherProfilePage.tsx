import { useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import UserAddressCard from "../../components/UserProfile/UserAddressCard";
import TeacherInfoCard from "../../components/UserProfile/TeacherInfoCard";
import { useTeacherProfile } from "../../hooks/useTeacherProfile";
import Loader from "../../components/Loader/Loader";
import TeacherMetaCard from "../../components/UserProfile/TeacherMetaCard";

export default function TeacherProfilePage() {
  const { teacherId } = useParams();
  const { data, isLoading, error } = useTeacherProfile(teacherId);
  if (isLoading)
    return (
      <div>
        <Loader />
      </div>
    );

  if (error) return <div>Error loading teacher.</div>;
  if (!data) return <div>No teacher found.</div>;
  return (
    <>
      <PageMeta
        title="React.js Basic Tables Dashboard | TailAdmin - Next.js Admin Dashboard Template"
        description="This is React.js Basic Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Students Profile" />
      <div className="space-y-6">
        <div className="space-y-6">
          <TeacherMetaCard
            teacherId={data.id}
            firstName={data.user.firstName}
            lastName={data.user.lastName}
            email={data.user.email}
            profilePicture={data.user.image}
            phoneNumber={data.phone}
            profileAddress={data.address}
          />
          <TeacherInfoCard
            firstName={data.user.firstName}
            lastName={data.user.lastName}
            email={data.user.email}
            birthDate={data.birthDate}
            phone={data.phone}
            subject={data.subject}
            hiringDate={data.hiringDate}
            salary={data.salary}
          />
          <UserAddressCard address={data.address} />
        </div>
      </div>
    </>
  );
}
