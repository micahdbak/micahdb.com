import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLocationDot,
  faGraduationCap,
  faEnvelope,
  faFile
} from '@fortawesome/free-solid-svg-icons';
import { faGithubAlt, faLinkedin } from '@fortawesome/free-brands-svg-icons';

function TableRow(props) {
  const { children, className, icon } = props;

  return (
    <tr>
      <td className="text-center">
        <FontAwesomeIcon icon={icon} />
      </td>
      <td className={"pl-2 pr-4 text-sm " + className}>
        {children}
      </td>
    </tr>
  );
}

export function Main() {
  const [page] = useState(0);

  const pages = [
    (
      <>
        <img src="portrait.png" alt="Portrait" className="w-24 h-24 rounded-full" />
        <p className="mt-2 text-2xl">Micah Baker</p>
        <p className="mb-4 text-base">Software Developer</p>
        <table className="table-auto">
          <TableRow icon={faLocationDot}>Vancouver, BC, Canada</TableRow>
          <TableRow icon={faGraduationCap}>Simon Fraser University</TableRow>
          <TableRow icon={faEnvelope} className="text-blue-500">
            <a href="mailto:mdb15@sfu.ca">&lt;mdb15@sfu.ca&gt;</a>
          </TableRow>
          <TableRow icon={faGithubAlt} className="text-blue-500">
            <a href="https://github.com/micahdbak">@micahdbak</a>
          </TableRow>
          <TableRow icon={faLinkedin} className="text-blue-500">
            <a href="https://linkedin.com/in/micahdbak/">/in/micahdbak</a>
          </TableRow>
          <TableRow icon={faFile} className="text-blue-500">
            <a href="micah_baker_cv_may_2024.pdf">Resume</a>
          </TableRow>
        </table>
      </>
    )/*,
    (
      <div className="align-left">
        <p className="text-lg mb-2">Experience</p>
        <p className="text-base font-semibold">Improving</p>
        <p className="text-xs mb-2">
          Software Developer 1 (Co-op)<br />
          &emsp;September 2024 - Present
        </p>
        <p className="text-base font-semibold">Brave Technology Coop</p>
        <p className="text-xs">
          Firmware & Software Developer (Part-time)<br />
          &emsp;May 2023 - August 2024
        </p>
        <p className="text-xs">
          Firmware & Software Developer (Co-op)<br />
          &emsp;September 2023 - April 2024
        </p>
      </div>
    )*/
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh"
      }}
      className="bg-emerald-300 flex flex-col justify-center items-center gap-4"
    >
      <div className="bg-white rounded-lg p-10 flex flex-col items-center relative">
        {pages[page]}
      </div>
    </div>
  );
}