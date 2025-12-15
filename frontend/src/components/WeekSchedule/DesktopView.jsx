import { Fragment } from 'react';

export default function DesktopView({ table, datesArr }) {
  return (
    <div className="table-row-group">
      <div className="table-row text-xl font-semibold">
        {datesArr &&
          datesArr.map((e, i) => {
            // TODO: add Mid OR Evening
            return (
              <Fragment key={i}>
                <div className="table-cell" key={i}>
                  {table &&
                    table[i].map((employee, employeeIndex) => {
                      if (table[i].length - 2 <= employeeIndex && table[i].length > 1) {
                        return (
                          <div className="desktopview__employee" key={employee._id}>
                            <p key={employee._id}>{employee.username}</p>
                            <span className="ml-1 px-1 text-xs bg-orange-100 text-orange-600 rounded">Evening</span>
                          </div>
                        );
                      } else if (table[i].length - 4 <= employeeIndex && table[i].length > 2) {
                        return (
                          <div className="desktopview__employee" key={employee._id}>
                            <p key={employee._id}>{employee.username}</p>
                            <span className="ml-1 px-1 text-xs bg-blue-100 text-blue-600 rounded">Mid</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="desktopview__employee" key={employee._id}>
                            <p key={employee._id}>{employee.username}</p>
                          </div>
                        );
                      }
                    })}
                </div>
              </Fragment>
            );
          })}
      </div>
    </div>
  );
}
